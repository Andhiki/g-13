import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { MODERATION_ERRORS, type ModerationOperationResult } from "../-shared/errors";
import type { ModerateReviewInput } from "../-shared/moderation";
import type { ReviewStatus } from "../-shared/schemas";
import {
  getModerationCounts,
  getModerationReview,
  listModerationReviews,
  moderateReview,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };
type ReviewListData = {
  rows: Awaited<ReturnType<typeof listModerationReviews>>;
  counts: Awaited<ReturnType<typeof getModerationCounts>>;
};
type ReviewActionData = Pick<ModerateReviewInput, "reviewId" | "action">;

export async function inspectReviews(
  db: Database,
  actor: Actor,
  offset = 0,
  status: ReviewStatus = "all",
): Promise<ModerationOperationResult<ReviewListData>> {
  if (!canModerate(actor.role)) return { data: null, error: MODERATION_ERRORS.FORBIDDEN };
  const [rows, counts] = await Promise.all([
    listModerationReviews(db, offset, status),
    getModerationCounts(db),
  ]);
  return { data: { rows, counts }, error: null };
}

export async function inspectReview(
  db: Database,
  actor: Actor,
  reviewId: string,
): Promise<ModerationOperationResult<Awaited<ReturnType<typeof getModerationReview>>>> {
  if (!canModerate(actor.role)) return { data: null, error: MODERATION_ERRORS.FORBIDDEN };
  return { data: await getModerationReview(db, reviewId), error: null };
}

export async function moderateLecturerReview(
  db: Database,
  actor: Actor,
  input: ModerateReviewInput,
): Promise<ModerationOperationResult<ReviewActionData>> {
  if (!canModerate(actor.role)) return { data: null, error: MODERATION_ERRORS.FORBIDDEN };
  if (!(await moderateReview(db, input))) {
    return { data: null, error: MODERATION_ERRORS.REVIEW_ACTION_UNAVAILABLE };
  }
  return { data: { reviewId: input.reviewId, action: input.action }, error: null };
}
