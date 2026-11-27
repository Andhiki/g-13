import type { createDatabase } from "@g13/db/client";
import { dispatchNotification } from "@/server/notifications";

import { reviewRateLimitResetAt } from "../-shared/rate-limit-window";
import { allowReviewAction } from "./rate-limit";
import { createReview, getReviewReferences } from "./repository";
import { REVIEW_ERRORS, type ReviewOperationResult } from "../-shared/errors";
import type { ReviewSubmission } from "../-shared/submission-schema";
import { screenReviewText, type ReviewModerationProvider } from "./review-screening";

type Database = ReturnType<typeof createDatabase>;

export function submitReviewAfterCaptcha<T>(
  verified: boolean,
  submit: () => Promise<ReviewOperationResult<T>>,
): Promise<ReviewOperationResult<T>> {
  if (!verified) return Promise.resolve({ data: null, error: REVIEW_ERRORS.CAPTCHA });
  return submit();
}

export async function submitReview(
  db: Database,
  review: ReviewSubmission,
  context: {
    ip: string | null;
    browserId?: string | null;
    secret: string;
    now?: number;
    provider: ReviewModerationProvider;
  },
): Promise<ReviewOperationResult<{ reviewId: string; status: "pending" | "published" }>> {
  const ip = context.ip;
  if (!ip) return { data: null, error: REVIEW_ERRORS.UNAVAILABLE };
  const references = await getReviewReferences(db, review);
  if (!references) return { data: null, error: REVIEW_ERRORS.INVALID };
  const now = context.now ?? Date.now();
  if (
    !(await allowReviewAction(
      db,
      { ip, browserId: context.browserId, secret: context.secret, now },
      "submission",
    ))
  ) {
    return { data: null, error: REVIEW_ERRORS.RATE_LIMIT, resetAt: reviewRateLimitResetAt(now) };
  }
  const { anonymous, ...values } = review;
  const reviewId = crypto.randomUUID();
  const authorName = anonymous ? "Anonymous" : review.authorName;
  const screeningInput = anonymous
    ? { body: review.body }
    : { body: review.body, displayName: authorName };
  const screening = await screenReviewText(screeningInput, context.provider);
  const ratingPending = Math.min(review.clarity, review.support, review.organization) <= 2;
  const status = screening === "clear" && !ratingPending ? "published" : "pending";
  await createReview(db, {
    ...values,
    id: reviewId,
    authorName,
    status,
  });
  if (status === "pending") {
    try {
      await dispatchNotification(db, {
        type: "review.created",
        resourceType: "lecturer_review",
        resourceId: reviewId,
        payload: {
          lecturerId: review.lecturerId,
          lecturerName: references.lecturerName,
          courseCode: references.courseCode,
          termLabel: review.termLabel,
          authorName,
          anonymous,
        },
        dedupeKey: `review.created:${reviewId}`,
        recipients: { roles: ["admin", "maintainer"] },
        now: context.now,
      });
    } catch {
      // Notification delivery is non-blocking for review submission.
    }
  }
  return { data: { reviewId, status }, error: null };
}
