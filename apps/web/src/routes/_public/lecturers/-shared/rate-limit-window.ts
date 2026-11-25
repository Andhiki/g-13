export const REVIEW_RATE_LIMIT_WINDOW_MS = 3_600_000;

export function reviewRateLimitResetAt(now: number): number {
  return (Math.floor(now / REVIEW_RATE_LIMIT_WINDOW_MS) + 1) * REVIEW_RATE_LIMIT_WINDOW_MS;
}
