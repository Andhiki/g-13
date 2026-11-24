import type { createDatabase } from "@g13/db/client";
import { dispatchNotification } from "@/server/notifications";

import { allowReviewAction } from "./rate-limit";
import { createReview, getReviewReferences } from "./repository";
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
): Promise<ReviewOperationResult<{ reviewId: string; status: "pending" | "published" }>> {
  const ip = context.ip;
  if (!ip) return { data: null, error: REVIEW_ERRORS.UNAVAILABLE };
  const references = await getReviewReferences(db, review);
  if (!references) return { data: null, error: REVIEW_ERRORS.INVALID };
  if (!(await allowReviewAction(db, { ...context, ip }, "submission")))
    return { data: null, error: REVIEW_ERRORS.RATE_LIMIT };
  const { anonymous, ...values } = review;
  const reviewId = crypto.randomUUID();
  const authorName = anonymous ? "Anonymous" : review.authorName;
  const status =
    review.clarity <= 2 || review.support <= 2 || review.organization <= 2
      ? "pending"
      : "published";
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
