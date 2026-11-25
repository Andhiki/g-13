import { REVIEW_ERRORS } from "../-shared/errors";
import { reviewRateLimitResetAt } from "../-shared/rate-limit-window";

const SUBMISSION_ERROR_MESSAGES: Record<string, string> = {
  [REVIEW_ERRORS.CAPTCHA]: "Security verification failed. Please try again.",
  [REVIEW_ERRORS.INVALID]:
    "The lecturer or course may no longer be available. Refresh the page and try again.",
  [REVIEW_ERRORS.UNAVAILABLE]: "Reviews are temporarily unavailable. Please try again later.",
};

function formatResetTime(timestamp: number): string {
  const reset = new Date(timestamp);
  return `${String(reset.getHours()).padStart(2, "0")}:${String(reset.getMinutes()).padStart(2, "0")}`;
}

export function submissionErrorMessage(
  error: unknown,
  text: (key: string, values?: Record<string, unknown>) => string,
  now = Date.now(),
) {
  const rateLimit =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === REVIEW_ERRORS.RATE_LIMIT;
  const code = error instanceof Error ? error.message : null;
  if (rateLimit || code === REVIEW_ERRORS.RATE_LIMIT) {
    const timestamp = rateLimit && "resetAt" in error ? error.resetAt : undefined;
    const resetAt =
      typeof timestamp === "number" && Number.isFinite(timestamp)
        ? timestamp
        : reviewRateLimitResetAt(now);
    return text("Submission limit reached. Resets at {{time}}.", {
      time: formatResetTime(resetAt),
    });
  }
  const key = code ? SUBMISSION_ERROR_MESSAGES[code] : undefined;
  return key
    ? text(key)
    : text("Could not confirm submission. Refresh the page before trying again.");
}
