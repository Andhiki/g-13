import { adminSearchCondition } from "../../-server/search";
import { reviewSearchFields } from "../-shared/schemas";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { courses } from "@g13/db/schema/courses";
import { lecturers } from "@g13/db/schema/lecturers";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import type { createDatabase } from "@g13/db/client";
import type { ModerateReviewInput } from "../-shared/moderation";
import type { ReviewStatus } from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

function searchCondition(query: string) {
  return adminSearchCondition(query, reviewSearchFields, {
    lecturerName: lecturers.name,
    courseCode: courses.code,
    courseNameId: courses.nameId,
    courseNameEn: courses.nameEn,
    termLabel: reviews.termLabel,
    authorName: reviews.authorName,
    body: reviews.body,
  });
}

const moderationReviewColumns = {
  id: reviews.id,
  lecturerName: lecturers.name,
  courseCode: courses.code,
  courseNameId: courses.nameId,
  courseNameEn: courses.nameEn,
  authorName: reviews.authorName,
  termLabel: reviews.termLabel,
  body: reviews.body,
  clarity: reviews.clarity,
  support: reviews.support,
  organization: reviews.organization,
  status: reviews.status,
  deletedAt: reviews.deletedAt,
  createdAt: reviews.createdAt,
};

export async function listModerationReviews(
  db: Database,
  offset: number,
  status: ReviewStatus,
  query = "",
) {
  return db
    .select(moderationReviewColumns)
    .from(reviews)
    .innerJoin(lecturers, eq(lecturers.id, reviews.lecturerId))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(
      and(
        status === "all"
          ? undefined
          : status === "deleted"
            ? isNotNull(reviews.deletedAt)
            : and(eq(reviews.status, status), isNull(reviews.deletedAt)),
        searchCondition(query),
      ),
    )
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(51)
    .offset(offset);
}

export async function getModerationReview(db: Database, reviewId: string) {
  const [review] = await db
    .select(moderationReviewColumns)
    .from(reviews)
    .innerJoin(lecturers, eq(lecturers.id, reviews.lecturerId))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(eq(reviews.id, reviewId));
  return review ?? null;
}

export async function getModerationCounts(db: Database, query = "") {
  const [counts] = await db
    .select({
      all: sql<number>`count(*)`,
      pending: sql<number>`coalesce(sum(case when ${reviews.status} = 'pending' and ${reviews.deletedAt} is null then 1 else 0 end), 0)`,
      published: sql<number>`coalesce(sum(case when ${reviews.status} = 'published' and ${reviews.deletedAt} is null then 1 else 0 end), 0)`,
      hidden: sql<number>`coalesce(sum(case when ${reviews.status} = 'hidden' and ${reviews.deletedAt} is null then 1 else 0 end), 0)`,
      deleted: sql<number>`coalesce(sum(case when ${reviews.deletedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(reviews)
    .innerJoin(lecturers, eq(lecturers.id, reviews.lecturerId))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(searchCondition(query));
  return counts;
}

export async function moderateReview(db: Database, input: ModerateReviewInput): Promise<boolean> {
  const [updated] = await db
    .update(reviews)
    .set(
      input.action === "delete"
        ? { deletedAt: new Date() }
        : { status: input.action === "hide" ? "hidden" : "published" },
    )
    .where(and(eq(reviews.id, input.reviewId), isNull(reviews.deletedAt)))
    .returning({ id: reviews.id });
  return updated !== undefined;
}
