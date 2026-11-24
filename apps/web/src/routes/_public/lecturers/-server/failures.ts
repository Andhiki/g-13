import { rejectServerFunction } from "@/server/server-function-error";
import { REVIEW_ERRORS, type ReviewOperationError } from "../-shared/errors";

const submissionErrorStatuses = {
  [REVIEW_ERRORS.INVALID]: 400,
  [REVIEW_ERRORS.UNAVAILABLE]: 503,
  [REVIEW_ERRORS.RATE_LIMIT]: 429,
  [REVIEW_ERRORS.CAPTCHA]: 400,
} satisfies Record<ReviewOperationError, number>;

const likeErrorStatuses = {
  [REVIEW_ERRORS.INVALID]: 404,
  [REVIEW_ERRORS.UNAVAILABLE]: 503,
  [REVIEW_ERRORS.RATE_LIMIT]: 429,
  [REVIEW_ERRORS.CAPTCHA]: 400,
} satisfies Record<ReviewOperationError, number>;

export function rejectSubmissionOperation(error: ReviewOperationError): never {
  return rejectServerFunction(submissionErrorStatuses[error], error);
}

export function rejectReviewLikeOperation(error: ReviewOperationError): never {
  return rejectServerFunction(likeErrorStatuses[error], error);
}
