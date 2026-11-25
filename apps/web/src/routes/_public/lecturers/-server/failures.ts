import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { rejectServerFunction } from "@/server/server-function-error";
import { REVIEW_ERRORS, type ReviewOperationError } from "../-shared/errors";

type OtherReviewError = Exclude<ReviewOperationError, typeof REVIEW_ERRORS.RATE_LIMIT>;

const submissionErrorStatuses = {
  [REVIEW_ERRORS.INVALID]: 400,
  [REVIEW_ERRORS.UNAVAILABLE]: 503,
  [REVIEW_ERRORS.CAPTCHA]: 400,
} satisfies Record<OtherReviewError, number>;

const likeErrorStatuses = {
  [REVIEW_ERRORS.INVALID]: 404,
  [REVIEW_ERRORS.UNAVAILABLE]: 503,
  [REVIEW_ERRORS.CAPTCHA]: 400,
} satisfies Record<OtherReviewError, number>;

export function rejectRateLimitedReview(resetAt: number): never {
  const retryAfter = Math.max(0, Math.ceil((resetAt - Date.now()) / 1_000));
  setResponseHeader("Retry-After", String(retryAfter));
  setResponseStatus(429);
  throw new Error(REVIEW_ERRORS.RATE_LIMIT, { cause: resetAt });
}

export function rejectSubmissionOperation(error: OtherReviewError): never {
  return rejectServerFunction(submissionErrorStatuses[error], error);
}

export function rejectReviewLikeOperation(error: OtherReviewError): never {
  return rejectServerFunction(likeErrorStatuses[error], error);
}
