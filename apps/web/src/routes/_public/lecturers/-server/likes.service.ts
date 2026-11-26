import type { createDatabase } from "@g13/db/client";
import { reviewRateLimitResetAt } from "../-shared/rate-limit-window";
import { allowReviewAction } from "./rate-limit";
import { addReviewLike, getVisibleReviewId, removeReviewLike } from "./repository";
import { REVIEW_ERRORS, type ReviewOperationResult } from "../-shared/errors";
import type { ReviewLikeInput } from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

export async function setReviewLike(
  db: Database,
  input: ReviewLikeInput,
  context: { ip: string | null; secret: string; now?: number },
): Promise<ReviewOperationResult<{ reviewId: string; liked: boolean }>> {
  const ip = context.ip;
  if (!ip) return { data: null, error: REVIEW_ERRORS.UNAVAILABLE };
  if (!(await getVisibleReviewId(db, input.reviewId)))
    return { data: null, error: REVIEW_ERRORS.INVALID };
  const now = context.now ?? Date.now();
  if (!(await allowReviewAction(db, { ...context, ip, browserId: input.browserId, now }, "like"))) {
    return { data: null, error: REVIEW_ERRORS.RATE_LIMIT, resetAt: reviewRateLimitResetAt(now) };
  }
  const { reviewId, browserId } = input;
  if (input.liked) await addReviewLike(db, { reviewId, browserId });
  else await removeReviewLike(db, { reviewId, browserId });
  return { data: { reviewId, liked: input.liked }, error: null };
}
