import { and, asc, desc, eq, gt, inArray, isNull, lt, lte, sql, or, type SQL } from "drizzle-orm";
import { courses } from "@g13/db/schema/courses";
import { lecturers } from "@g13/db/schema/lecturers";
import { reviews, reviewLikes, reviewSubmissionLimits } from "@g13/db/schema/lecturer-reviews";
import type { createDatabase } from "@g13/db/client";
import type { CoursePickerCursor, CoursePickerInput } from "../-shared/schemas";
import type { ReviewCourseOption } from "../-shared/course-search";

type Database = ReturnType<typeof createDatabase>;
const visibleReview = and(eq(reviews.status, "published"), isNull(reviews.deletedAt));
const activeCourse = isNull(courses.deletedAt);
const activeLecturer = isNull(lecturers.deletedAt);
const COURSE_PICKER_PAGE_SIZE = 20;

// Substring search over code and both names; %, _ and \ are taken literally.
function courseSearchCondition(query: string): SQL | undefined {
  if (!query) return undefined;
  const pattern = `%${query.replaceAll(/[\\%_]/gu, "\\$&")}%`;
  return or(
    sql`${courses.code} like ${pattern} escape '\\'`,
    sql`${courses.nameId} like ${pattern} escape '\\'`,
    sql`${courses.nameEn} like ${pattern} escape '\\'`,
  );
}

export async function getCoursePickerPage(
  db: Database,
  input: CoursePickerInput,
): Promise<{ rows: ReviewCourseOption[]; nextCursor: CoursePickerCursor | null }> {
  const sortName = input.language === "en" ? courses.nameEn : courses.nameId;
  const cursor = input.cursor;
  // Keyset pagination: rows strictly after (name, id) in (sort name, id) ascending order.
  const afterCursor = cursor
    ? or(gt(sortName, cursor.name), and(eq(sortName, cursor.name), gt(courses.id, cursor.id)))
    : undefined;
  const rows = await db
    .select({ id: courses.id, code: courses.code, nameId: courses.nameId, nameEn: courses.nameEn })
    .from(courses)
    .where(and(activeCourse, afterCursor, courseSearchCondition(input.query)))
    .orderBy(asc(sortName), asc(courses.id))
    .limit(COURSE_PICKER_PAGE_SIZE + 1);

  const page = rows.slice(0, COURSE_PICKER_PAGE_SIZE);
  const last = page.at(-1);
  return {
    rows: page,
    nextCursor:
      last && rows.length > page.length
        ? { name: input.language === "en" ? last.nameEn : last.nameId, id: last.id }
        : null,
  };
}

async function getCourseCatalog(db: Database) {
  return db
    .select({ id: courses.id, code: courses.code, nameId: courses.nameId, nameEn: courses.nameEn })
    .from(courses)
    .where(activeCourse)
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
      .where(activeLecturer)
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
      .innerJoin(lecturers, and(eq(lecturers.id, reviews.lecturerId), activeLecturer))
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

const reviewCardFields = {
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
};

export function getOwnPendingReviews(db: Database, lecturerId: string, reviewIds: string[]) {
  return db
    .select(reviewCardFields)
    .from(reviews)
    .innerJoin(lecturers, and(eq(lecturers.id, reviews.lecturerId), activeLecturer))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(
      and(
        eq(reviews.lecturerId, lecturerId),
        inArray(reviews.id, reviewIds),
        eq(reviews.status, "pending"),
        isNull(reviews.deletedAt),
      ),
    )
    .orderBy(desc(reviews.createdAt), asc(reviews.id));
}

export async function getLecturerDetailData(db: Database, lecturerId: string) {
  const [lecturer] = await db
    .select({ id: lecturers.id, name: lecturers.name })
    .from(lecturers)
    .where(and(eq(lecturers.id, lecturerId), activeLecturer));
  if (!lecturer) return null;

  const [courseRows, reviewRows] = await Promise.all([
    getCourseCatalog(db),
    db
      .select({
        ...reviewCardFields,
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

export async function getReviewReferences(
  db: Database,
  references: { lecturerId: string; courseId: string },
): Promise<{ lecturerName: string; courseCode: string } | null> {
  const [[lecturer], [course]] = await Promise.all([
    db
      .select({ id: lecturers.id, name: lecturers.name })
      .from(lecturers)
      .where(and(eq(lecturers.id, references.lecturerId), activeLecturer)),
    db
      .select({ id: courses.id, code: courses.code })
      .from(courses)
      .where(and(eq(courses.id, references.courseId), activeCourse)),
  ]);
  if (!lecturer || !course) return null;
  return { lecturerName: lecturer.name, courseCode: course.code };
}

export async function hasReviewReferences(
  db: Database,
  references: { lecturerId: string; courseId: string },
): Promise<boolean> {
  return (await getReviewReferences(db, references)) !== null;
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
    status: "pending" | "published" | "hidden";
  },
): Promise<void> {
  await db.insert(reviews).values(review);
}

export async function getVisibleReviewId(db: Database, reviewId: string): Promise<string | null> {
  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .innerJoin(lecturers, and(eq(lecturers.id, reviews.lecturerId), activeLecturer))
    .where(and(eq(reviews.id, reviewId), visibleReview));
  return review?.id ?? null;
}

export async function getBrowserReviewLikes(db: Database, browserId: string): Promise<string[]> {
  const rows = await db
    .select({ reviewId: reviewLikes.reviewId })
    .from(reviewLikes)
    .innerJoin(reviews, eq(reviews.id, reviewLikes.reviewId))
    .innerJoin(lecturers, and(eq(lecturers.id, reviews.lecturerId), activeLecturer))
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
