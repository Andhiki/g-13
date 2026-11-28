import { adminSearchColumns } from "../../-server/search";
import { reviewSearchFields } from "../-shared/schemas";
import { and, desc, eq, inArray, isNotNull, isNull, type SQL } from "drizzle-orm";
import { courses } from "@g13/db/schema/courses";
import { lecturers } from "@g13/db/schema/lecturers";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import type { createDatabase } from "@g13/db/client";
import type { ModerateReviewInput } from "../-shared/moderation";
import type { ReviewStatus } from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;
type StoredReviewStatus = (typeof reviews.status.enumValues)[number];

/** Which reviews each moderation tab holds. The list and its counts share this. */
export function moderationStatusCondition(status: ReviewStatus): SQL | undefined {
  if (status === "all") return undefined;
  if (status === "deleted") return isNotNull(reviews.deletedAt);
  return and(eq(reviews.status, status), isNull(reviews.deletedAt));
}

/**
 * Legal moderation moves: the review states each action accepts and the state
 * it leaves. Deleting is permanent, so a deleted review accepts nothing.
 */
const transitions = {
  approve: { from: ["pending"], to: "published" },
  hide: { from: ["pending", "published"], to: "hidden" },
  restore: { from: ["hidden"], to: "published" },
  delete: { from: ["pending", "published", "hidden"], to: null },
} satisfies Record<
  ModerateReviewInput["action"],
  { from: StoredReviewStatus[]; to: StoredReviewStatus | null }
>;

export const moderationSearchColumns = adminSearchColumns(reviewSearchFields, {
  lecturerName: lecturers.name,
  courseCode: courses.code,
  courseNameId: courses.nameId,
  courseNameEn: courses.nameEn,
  termLabel: reviews.termLabel,
  authorName: reviews.authorName,
  body: reviews.body,
});

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
  pendingReasons: reviews.pendingReasons,
  deletedAt: reviews.deletedAt,
  createdAt: reviews.createdAt,
};

export async function selectModerationReviews(
  db: Database,
  where: SQL | undefined,
  page: { limit: number; offset: number },
) {
  return db
    .select(moderationReviewColumns)
    .from(reviews)
    .innerJoin(lecturers, eq(lecturers.id, reviews.lecturerId))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(where)
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(page.limit)
    .offset(page.offset);
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

export async function countModerationReviews(
  db: Database,
  counts: Record<string, SQL<number>>,
  where: SQL | undefined,
) {
  const [result] = await db
    .select(counts)
    .from(reviews)
    .innerJoin(lecturers, eq(lecturers.id, reviews.lecturerId))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(where);
  return result;
}

/**
 * Applies a moderation action if the review's current state allows it. The
 * check and the write are one statement, so concurrent moderators cannot both
 * act on a stale state. Returns false for a missing review or an illegal move.
 */
export async function moderateReview(db: Database, input: ModerateReviewInput): Promise<boolean> {
  const { from, to } = transitions[input.action];
  const [updated] = await db
    .update(reviews)
    .set(to === null ? { deletedAt: new Date() } : { status: to })
    .where(
      and(eq(reviews.id, input.reviewId), isNull(reviews.deletedAt), inArray(reviews.status, from)),
    )
    .returning({ id: reviews.id });
  return updated !== undefined;
}
