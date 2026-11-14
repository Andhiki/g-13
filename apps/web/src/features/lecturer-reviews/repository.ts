import { asc, eq, and, isNull, sql } from "drizzle-orm";
import { courses, lecturers, reviews, reviewLikes } from "@g13/db";
import type { createDatabase } from "@g13/db";

type Database = ReturnType<typeof createDatabase>;
const visibleReview = and(eq(reviews.status, "published"), isNull(reviews.deletedAt));

async function getCourseCatalog(db: Database) {
  return db
    .select({ id: courses.id, code: courses.code, nameId: courses.nameId, nameEn: courses.nameEn })
    .from(courses)
    .orderBy(asc(courses.code));
}

export async function getLecturerDirectory(db: Database) {
  const [courseRows, lecturerRows, courseReviewRows] = await Promise.all([
    getCourseCatalog(db),
    db
      .select({
        id: lecturers.id,
        name: lecturers.name,
        reviewCount: sql<number>`count(${reviews.id})`,
        overallAverage: sql<
          number | null
        >`avg((${reviews.clarity} + ${reviews.support} + ${reviews.organization}) / 3.0)`,
      })
      .from(lecturers)
      .leftJoin(reviews, and(eq(reviews.lecturerId, lecturers.id), visibleReview))
      .groupBy(lecturers.id)
      .orderBy(asc(lecturers.name)),
    db
      .select({
        lecturerId: reviews.lecturerId,
        courseId: courses.id,
        code: courses.code,
        nameId: courses.nameId,
        nameEn: courses.nameEn,
        overall: sql<number>`(${reviews.clarity} + ${reviews.support} + ${reviews.organization}) / 3.0`,
      })
      .from(reviews)
      .innerJoin(courses, eq(courses.id, reviews.courseId))
      .where(visibleReview)
      .orderBy(asc(courses.code)),
  ]);

  const summaries = new Map<
    string,
    Map<
      string,
      {
        courseId: string;
        code: string;
        nameId: string;
        nameEn: string;
        total: number;
        count: number;
      }
    >
  >();
  for (const review of courseReviewRows) {
    let lecturerCourses = summaries.get(review.lecturerId);
    if (!lecturerCourses) summaries.set(review.lecturerId, (lecturerCourses = new Map()));
    let summary = lecturerCourses.get(review.courseId);
    if (!summary) {
      summary = {
        courseId: review.courseId,
        code: review.code,
        nameId: review.nameId,
        nameEn: review.nameEn,
        total: 0,
        count: 0,
      };
      lecturerCourses.set(review.courseId, summary);
    }
    summary.total += Number(review.overall);
    summary.count += 1;
  }

  return {
    courses: courseRows,
    lecturers: lecturerRows.map((lecturer) => ({
      id: lecturer.id,
      name: lecturer.name,
      reviewCount: Number(lecturer.reviewCount),
      overallAverage: lecturer.overallAverage === null ? null : Number(lecturer.overallAverage),
      courses: [...(summaries.get(lecturer.id)?.values() ?? [])].map(
        ({ total, count, ...course }) => ({ ...course, overallAverage: total / count }),
      ),
    })),
  };
}

export async function getLecturerDetail(db: Database, lecturerId: string) {
  const [lecturer] = await db
    .select({ id: lecturers.id, name: lecturers.name })
    .from(lecturers)
    .where(eq(lecturers.id, lecturerId));
  if (!lecturer) return null;

  const [courseRows, reviewRows] = await Promise.all([
    getCourseCatalog(db),
    db
      .select({
        id: reviews.id,
        lecturerId: reviews.lecturerId,
        courseId: courses.id,
        code: courses.code,
        nameId: courses.nameId,
        nameEn: courses.nameEn,
        termLabel: reviews.termLabel,
        authorName: reviews.authorName,
        clarity: reviews.clarity,
        support: reviews.support,
        organization: reviews.organization,
        overall: sql<number>`(${reviews.clarity} + ${reviews.support} + ${reviews.organization}) / 3.0`,
        body: reviews.body,
        createdAt: reviews.createdAt,
        likeCount: sql<number>`(select count(*) from ${reviewLikes} where ${reviewLikes.reviewId} = ${reviews.id})`,
      })
      .from(reviews)
      .innerJoin(courses, eq(courses.id, reviews.courseId))
      .where(and(eq(reviews.lecturerId, lecturerId), visibleReview))
      .orderBy(asc(reviews.createdAt)),
  ]);

  const mean = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const courseMap = new Map(
    reviewRows.map((review) => [
      review.courseId,
      { id: review.courseId, code: review.code, nameId: review.nameId, nameEn: review.nameEn },
    ]),
  );
  return {
    lecturer: {
      ...lecturer,
      reviewCount: reviewRows.length,
      overallAverage: mean(reviewRows.map((review) => review.overall)),
      clarityAverage: mean(reviewRows.map((review) => review.clarity)),
      supportAverage: mean(reviewRows.map((review) => review.support)),
      organizationAverage: mean(reviewRows.map((review) => review.organization)),
      courses: [...courseMap.values()],
    },
    courses: courseRows,
    reviews: reviewRows,
  };
}
