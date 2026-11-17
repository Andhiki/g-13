import type { createDatabase } from "@g13/db";

import { allowReviewAction } from "./rate-limit";
import { createReview, hasReviewReferences } from "./repository";
import { REVIEW_ERRORS, type ReviewOperationResult } from "../-shared/errors";
import type { ReviewSubmission } from "../-shared/submission-schema";

type Database = ReturnType<typeof createDatabase>;

export async function submitReview(
  db: Database,
  review: ReviewSubmission,
  context: {
    ip: string | null;
    secret: string;
    now?: number;
  },
): Promise<ReviewOperationResult<{ reviewId: string }>> {
  const ip = context.ip;
  if (!ip) return { data: null, error: REVIEW_ERRORS.UNAVAILABLE };
  if (!(await hasReviewReferences(db, review))) return { data: null, error: REVIEW_ERRORS.INVALID };
  if (!(await allowReviewAction(db, { ...context, ip }, "submission")))
    return { data: null, error: REVIEW_ERRORS.RATE_LIMIT };
  const { anonymous, ...values } = review;
  const reviewId = crypto.randomUUID();
  await createReview(db, {
    ...values,
    id: reviewId,
    authorName: anonymous ? "Anonymous" : review.authorName,
    status: "published",
  });
  return { data: { reviewId }, error: null };
}
