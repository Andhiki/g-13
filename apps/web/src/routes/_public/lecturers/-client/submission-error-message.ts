import { REVIEW_ERRORS } from "../-shared/errors";

const SUBMISSION_ERROR_MESSAGES: Record<string, string> = {
  [REVIEW_ERRORS.CAPTCHA]: "Security verification failed. Please try again.",
  [REVIEW_ERRORS.INVALID]:
    "The lecturer or course may no longer be available. Refresh the page and try again.",
  [REVIEW_ERRORS.UNAVAILABLE]: "Reviews are temporarily unavailable. Please try again later.",
};

type Text = (key: string, values?: Record<string, unknown>) => string;

/** Reads the `{ code, resetAt? }` review failure; anything else is unknown. */
function readReviewFailure(error: unknown): { code: string; resetAt: number | null } | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  if (typeof error.code !== "string") return null;
  const resetAt = "resetAt" in error ? error.resetAt : undefined;
  return {
    code: error.code,
    resetAt: typeof resetAt === "number" && Number.isFinite(resetAt) ? resetAt : null,
  };
}

function formatResetTime(timestamp: number): string {
  const reset = new Date(timestamp);
  return `${String(reset.getHours()).padStart(2, "0")}:${String(reset.getMinutes()).padStart(2, "0")}`;
}

function rateLimitMessage(error: unknown, text: Text, messageKey: string): string | null {
  const failure = readReviewFailure(error);
  if (failure?.code !== REVIEW_ERRORS.RATE_LIMIT || failure.resetAt === null) return null;
  return text(messageKey, { time: formatResetTime(failure.resetAt) });
}

export function submissionErrorMessage(error: unknown, text: Text) {
  const limit = rateLimitMessage(error, text, "Submission limit reached. Resets at {{time}}.");
  if (limit) return limit;
  const code = readReviewFailure(error)?.code;
  const key = code ? SUBMISSION_ERROR_MESSAGES[code] : undefined;
  return key
    ? text(key)
    : text("Could not confirm submission. Refresh the page before trying again.");
}

export function likeErrorMessage(error: unknown, text: Text) {
  return (
    rateLimitMessage(error, text, "Like limit reached. Resets at {{time}}.") ??
    text("Could not update like. Please try again.")
  );
}
