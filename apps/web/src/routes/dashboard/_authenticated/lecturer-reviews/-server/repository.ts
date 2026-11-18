import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { courses, lecturers, reviews, type createDatabase } from "@g13/db";
import type { ModerateReviewInput } from "../-shared/moderation";
import type { ReviewStatus } from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

export async function listModerationReviews(db: Database, offset: number, status: ReviewStatus) {
  return db
    .select({
      id: reviews.id,
      lecturerName: lecturers.name,
      courseCode: courses.code,
      authorName: reviews.authorName,
      termLabel: reviews.termLabel,
      body: reviews.body,
      clarity: reviews.clarity,
      support: reviews.support,
      organization: reviews.organization,
      status: reviews.status,
      deletedAt: reviews.deletedAt,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(lecturers, eq(lecturers.id, reviews.lecturerId))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(
      status === "all"
        ? undefined
        : status === "deleted"
          ? isNotNull(reviews.deletedAt)
          : and(eq(reviews.status, status), isNull(reviews.deletedAt)),
    )
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(51)
    .offset(offset);
}

export async function getModerationCounts(db: Database) {
  const [counts] = await db
    .select({
      all: sql<number>`count(*)`,
      published: sql<number>`coalesce(sum(case when ${reviews.status} = 'published' and ${reviews.deletedAt} is null then 1 else 0 end), 0)`,
      hidden: sql<number>`coalesce(sum(case when ${reviews.status} = 'hidden' and ${reviews.deletedAt} is null then 1 else 0 end), 0)`,
      deleted: sql<number>`coalesce(sum(case when ${reviews.deletedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(reviews);
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
