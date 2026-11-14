import { and, asc, eq, isNull, lt, lte, sql } from "drizzle-orm";
import { courses, lecturers, reviews, reviewLikes, reviewSubmissionLimits } from "@g13/db";
import type { createDatabase } from "@g13/db";

type Database = ReturnType<typeof createDatabase>;
const visibleReview = and(eq(reviews.status, "published"), isNull(reviews.deletedAt));

async function getCourseCatalog(db: Database) {
  return db
    .select({ id: courses.id, code: courses.code, nameId: courses.nameId, nameEn: courses.nameEn })
    .from(courses)
    .orderBy(asc(courses.code));
}

export async function getLecturerDirectoryData(db: Database) {
  const [courseRows, lecturerRows, courseReviewRows] = await Promise.all([
    getCourseCatalog(db),
    db
      .select({
        id: lecturers.id,
        name: lecturers.name,
        reviewCount: sql<number>`count(${reviews.id})`,
        clarityAverage: sql<number | null>`avg(${reviews.clarity})`,
        supportAverage: sql<number | null>`avg(${reviews.support})`,
        organizationAverage: sql<number | null>`avg(${reviews.organization})`,
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
        clarityAverage: sql<number>`avg(${reviews.clarity})`,
        supportAverage: sql<number>`avg(${reviews.support})`,
        organizationAverage: sql<number>`avg(${reviews.organization})`,
      })
      .from(reviews)
      .innerJoin(courses, eq(courses.id, reviews.courseId))
      .where(visibleReview)
      .groupBy(reviews.lecturerId, courses.id)
      .orderBy(asc(courses.code)),
  ]);

  return {
    courses: courseRows,
    lecturers: lecturerRows,
    courseAggregates: courseReviewRows,
  };
}

export async function getLecturerDetailData(db: Database, lecturerId: string) {
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
        body: reviews.body,
        createdAt: reviews.createdAt,
        likeCount: sql<number>`(select count(*) from ${reviewLikes} where ${reviewLikes.reviewId} = ${reviews.id})`,
      })
      .from(reviews)
      .innerJoin(courses, eq(courses.id, reviews.courseId))
      .where(and(eq(reviews.lecturerId, lecturerId), visibleReview))
      .orderBy(asc(reviews.createdAt)),
  ]);

  return {
    lecturer,
    courses: courseRows,
    reviews: reviewRows,
  };
}

export async function hasReviewReferences(
  db: Database,
  references: { lecturerId: string; courseId: string },
): Promise<boolean> {
  const [lecturer, course] = await Promise.all([
    db.select({ id: lecturers.id }).from(lecturers).where(eq(lecturers.id, references.lecturerId)),
    db.select({ id: courses.id }).from(courses).where(eq(courses.id, references.courseId)),
  ]);
  return lecturer.length > 0 && course.length > 0;
}

export async function createReview(
  db: Database,
  review: {
    id: string;
    lecturerId: string;
    courseId: string;
    termLabel: string;
    authorName: string;
    clarity: number;
    support: number;
    organization: number;
    body: string;
    status: "published" | "hidden";
  },
): Promise<void> {
  await db.insert(reviews).values(review);
}

export async function getVisibleReviewId(db: Database, reviewId: string): Promise<string | null> {
  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), visibleReview));
  return review?.id ?? null;
}

export async function getBrowserReviewLikes(db: Database, browserId: string): Promise<string[]> {
  const rows = await db
    .select({ reviewId: reviewLikes.reviewId })
    .from(reviewLikes)
    .innerJoin(reviews, eq(reviews.id, reviewLikes.reviewId))
    .where(and(eq(reviewLikes.browserId, browserId), visibleReview));
  return rows.map((row) => row.reviewId);
}

export async function addReviewLike(
  db: Database,
  input: { reviewId: string; browserId: string },
): Promise<void> {
  await db.insert(reviewLikes).values(input).onConflictDoNothing();
}

export async function removeReviewLike(
  db: Database,
  input: { reviewId: string; browserId: string },
): Promise<void> {
  await db
    .delete(reviewLikes)
    .where(
      and(eq(reviewLikes.reviewId, input.reviewId), eq(reviewLikes.browserId, input.browserId)),
    );
}

export async function incrementReviewActionLimit(
  db: Database,
  input: { key: string; now: number; expiresAt: number; limit: number },
): Promise<boolean> {
  await db.delete(reviewSubmissionLimits).where(lte(reviewSubmissionLimits.expiresAt, input.now));
  const [allowed] = await db
    .insert(reviewSubmissionLimits)
    .values({ key: input.key, count: 1, expiresAt: input.expiresAt })
    .onConflictDoUpdate({
      target: reviewSubmissionLimits.key,
      set: { count: sql`${reviewSubmissionLimits.count} + 1` },
      setWhere: lt(reviewSubmissionLimits.count, input.limit),
    })
    .returning({ count: reviewSubmissionLimits.count });
  return allowed !== undefined;
}
