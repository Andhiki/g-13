import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import {
  REVIEW_ERRORS,
  type ReviewOperationError,
  type ReviewOperationResult,
} from "../-shared/errors";

/** The one shape a review failure takes on the wire. */
export type ReviewFailure = { code: ReviewOperationError; resetAt?: number };

const statuses = {
  submission: {
    [REVIEW_ERRORS.INVALID]: 400,
    [REVIEW_ERRORS.UNAVAILABLE]: 503,
    [REVIEW_ERRORS.CAPTCHA]: 400,
    [REVIEW_ERRORS.RATE_LIMIT]: 429,
  },
  like: {
    [REVIEW_ERRORS.INVALID]: 404,
    [REVIEW_ERRORS.UNAVAILABLE]: 503,
    [REVIEW_ERRORS.CAPTCHA]: 400,
    [REVIEW_ERRORS.RATE_LIMIT]: 429,
  },
} satisfies Record<string, Record<ReviewOperationError, number>>;

/** Returns a review operation's data, or sets the HTTP status and throws its failure. */
export function respondToReviewOperation<T>(
  operation: keyof typeof statuses,
  result: ReviewOperationResult<T>,
  now = Date.now(),
): T {
  if (result.error === null) return result.data;
  setResponseStatus(statuses[operation][result.error]);
  if (result.error === REVIEW_ERRORS.RATE_LIMIT) {
    setResponseHeader(
      "Retry-After",
      String(Math.max(0, Math.ceil((result.resetAt - now) / 1_000))),
    );
    throw { code: result.error, resetAt: result.resetAt } satisfies ReviewFailure;
  }
  throw { code: result.error } satisfies ReviewFailure;
}
