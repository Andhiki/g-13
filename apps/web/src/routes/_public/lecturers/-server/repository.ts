import { and, asc, desc, eq, gt, inArray, isNull, sql, or, type SQL } from "drizzle-orm";
import { courses } from "@g13/db/schema/courses";
import { lecturers } from "@g13/db/schema/lecturers";
import { reviews, reviewLikes, type ReviewPendingReason } from "@g13/db/schema/lecturer-reviews";
import type { createDatabase } from "@g13/db/client";
import type {
  CoursePickerCursor,
  CoursePickerInput,
  LecturerReviewsInput,
} from "../-shared/schemas";
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
  const [summary, courseRows] = await Promise.all([
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
      .where(and(eq(lecturers.id, lecturerId), activeLecturer))
      .groupBy(lecturers.id),
    db
      .select({
        id: courses.id,
        code: courses.code,
        nameId: courses.nameId,
        nameEn: courses.nameEn,
      })
      .from(reviews)
      .innerJoin(courses, eq(courses.id, reviews.courseId))
      .where(and(eq(reviews.lecturerId, lecturerId), visibleReview))
      .groupBy(courses.id)
      .orderBy(asc(sql`min(${reviews.createdAt})`), asc(courses.id)),
  ]);
  const [lecturer] = summary;
  return lecturer ? { lecturer, courses: courseRows } : null;
}

const LECTURER_REVIEW_PAGE_SIZE = 20;

export async function getLecturerReviewRows(db: Database, input: LecturerReviewsInput) {
  const { lecturerId, courseId, order, cursor } = input;
  // Normalize each sort to ascending keys so the cursor uses the same tuple as ORDER BY.
  const rating = sql<number>`(${reviews.clarity} + ${reviews.support} + ${reviews.organization})`;
  const ratingKey = order === "highest" ? sql`-${rating}` : rating;
  const dateKey = order === "oldest" ? reviews.createdAt : sql`-${reviews.createdAt}`;
  const byRating = order === "highest" || order === "lowest";
  const sortKeys = byRating ? [ratingKey, dateKey, reviews.id] : [dateKey, reviews.id];
  const cursorDate = cursor && (order === "oldest" ? cursor.createdAt : -cursor.createdAt);
  const cursorRating = cursor && (order === "highest" ? -cursor.rating : cursor.rating);
  const afterCursor = cursor
    ? sql`(${sql.join(sortKeys, sql`, `)}) > (${byRating ? sql`${cursorRating}, ` : sql.empty()}${cursorDate}, ${cursor.id})`
    : undefined;

  const page = await db
    .select({
      ...reviewCardFields,
      likeCount: sql<number>`(select count(*) from ${reviewLikes} where ${reviewLikes.reviewId} = ${reviews.id})`,
    })
    .from(reviews)
    .innerJoin(lecturers, and(eq(lecturers.id, reviews.lecturerId), activeLecturer))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(
      and(
        eq(reviews.lecturerId, lecturerId),
        visibleReview,
        courseId === null ? undefined : eq(reviews.courseId, courseId),
        afterCursor,
      ),
    )
    .orderBy(...sortKeys)
    .limit(LECTURER_REVIEW_PAGE_SIZE + 1);
  const reviewsPage = page.slice(0, LECTURER_REVIEW_PAGE_SIZE);
  const last = reviewsPage.at(-1);
  return {
    reviews: reviewsPage,
    nextCursor:
      last && page.length > reviewsPage.length
        ? {
            id: last.id,
            rating: last.clarity + last.support + last.organization,
            createdAt: last.createdAt.getTime(),
          }
        : null,
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
    pendingReasons: ReviewPendingReason[] | null;
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

export async function writeReviewLike(
  db: Database,
  { reviewId, browserId, liked }: { reviewId: string; browserId: string; liked: boolean },
) {
  const change = liked
    ? db.insert(reviewLikes).values({ reviewId, browserId }).onConflictDoNothing()
    : db
        .delete(reviewLikes)
        .where(and(eq(reviewLikes.reviewId, reviewId), eq(reviewLikes.browserId, browserId)));
  const count = db
    .select({ count: sql<number>`count(*)` })
    .from(reviewLikes)
    .where(eq(reviewLikes.reviewId, reviewId));
  const [, [row]] = await db.batch([change, count]);
  return row.count;
}
