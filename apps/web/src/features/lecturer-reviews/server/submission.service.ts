import type { createDatabase } from "@g13/db";

import { allowReviewAction } from "./rate-limit";
import { createReview, hasReviewReferences } from "./repository";
import type { ReviewSubmission } from "../shared/submission-schema";

type Database = ReturnType<typeof createDatabase>;
export type SubmissionResult =
  | { ok: true; reviewId: string }
  | { ok: false; error: "invalid" | "unavailable" | "rate-limit" };

export async function submitReview(
  db: Database,
  review: ReviewSubmission,
  context: {
    ip: string | null;
    secret: string;
    now?: number;
  },
): Promise<SubmissionResult> {
  const ip = context.ip;
  if (!ip) return { ok: false, error: "unavailable" };
  if (!(await hasReviewReferences(db, review))) return { ok: false, error: "invalid" };
  if (!(await allowReviewAction(db, { ...context, ip }, "submission")))
    return { ok: false, error: "rate-limit" };
  const { anonymous, ...values } = review;
  const reviewId = crypto.randomUUID();
  await createReview(db, {
    ...values,
    id: reviewId,
    authorName: anonymous ? "Anonymous" : review.authorName,
    status: "published",
  });
  return { ok: true, reviewId };
}
