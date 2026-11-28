import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { MODERATION_ERRORS, type ModerationOperationResult } from "../-shared/errors";
import type { ModerateReviewInput } from "../-shared/moderation";
import type { ReviewStatus } from "../-shared/schemas";
import { reviewStatusSchema } from "../-shared/schemas";
import {
  countModerationReviews,
  getModerationReview,
  moderateReview,
  moderationSearchColumns,
  moderationStatusCondition,
  selectModerationReviews,
} from "./repository";
import { loadAdminList, type AdminListData } from "../../-server/admin-list";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };
type ReviewListData = AdminListData<
  ReviewStatus,
  Awaited<ReturnType<typeof selectModerationReviews>>[number]
>;
type ReviewActionData = Pick<ModerateReviewInput, "reviewId" | "action">;

export async function inspectReviews(
  db: Database,
  actor: Actor,
  offset = 0,
  status: ReviewStatus = "all",
  query = "",
): Promise<ModerationOperationResult<ReviewListData>> {
  const data = await loadAdminList(
    {
      canView: canModerate,
      statuses: reviewStatusSchema.options,
      statusCondition: moderationStatusCondition,
      searchColumns: moderationSearchColumns,
      rows: (where, page) => selectModerationReviews(db, where, page),
      count: (counts, where) => countModerationReviews(db, counts, where),
    },
    actor,
    { offset, status, query },
  );
  return data ? { data, error: null } : { data: null, error: MODERATION_ERRORS.FORBIDDEN };
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
