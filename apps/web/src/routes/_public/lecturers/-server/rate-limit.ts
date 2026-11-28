import type { createDatabase } from "@g13/db/client";
import { consumeRateLimit } from "@g13/db/rate-limit";
import { reviewSubmissionLimits } from "@g13/db/schema/lecturer-reviews";
import { reviewRateLimitIp } from "./rate-limit-ip";

type Database = ReturnType<typeof createDatabase>;

const REVIEW_RATE_LIMIT_WINDOW_MS = 3_600_000;

/** When the current hourly rate-limit window ends. */
export function reviewRateLimitResetAt(now: number): number {
  return (Math.floor(now / REVIEW_RATE_LIMIT_WINDOW_MS) + 1) * REVIEW_RATE_LIMIT_WINDOW_MS;
}

const SUBMISSION_LIMIT_PER_BROWSER = 3;
const SUBMISSION_LIMIT_PER_IP = 20;
const LIKE_LIMIT_PER_BROWSER = 60;
const LIKE_LIMIT_PER_IP = 300;
const LIKE_LIMIT_PER_IP_WITHOUT_BROWSER = 60;

function createSubmissionBrowserIdentity(browserId: string, window: number) {
  return `submission:browser:${window}:${browserId.toLowerCase()}`;
}

function createSubmissionIpIdentity(ip: string, window: number) {
  return `submission:ip:${window}:${ip}`;
}

function createLikeIpIdentity(ip: string, window: number) {
  return `like:${window}:${ip}`;
}

function createLikeBrowserIdentity(browserId: string, window: number) {
  return `like:browser:${window}:${browserId.toLowerCase()}`;
}

function incrementLimit(
  db: Database,
  context: { secret: string; now: number },
  identity: string,
  limit: number,
): Promise<boolean> {
  return consumeRateLimit(db, reviewSubmissionLimits, {
    secret: context.secret,
    identity,
    limit,
    now: context.now,
    expiresAt: reviewRateLimitResetAt(context.now),
  });
}

export async function allowReviewAction(
  db: Database,
  context: { ip: string; browserId?: string | null; secret: string; now?: number },
  action: "submission" | "like",
): Promise<boolean> {
  const now = context.now ?? Date.now();
  const window = Math.floor(now / REVIEW_RATE_LIMIT_WINDOW_MS);
  const limits = { secret: context.secret, now };
  const ip = reviewRateLimitIp(context.ip);
  if (action === "like") {
    const ipIdentity = createLikeIpIdentity(ip, window);
    if (!context.browserId) {
      return incrementLimit(db, limits, ipIdentity, LIKE_LIMIT_PER_IP_WITHOUT_BROWSER);
    }
    const browserAllowed = await incrementLimit(
      db,
      limits,
      createLikeBrowserIdentity(context.browserId, window),
      LIKE_LIMIT_PER_BROWSER,
    );
    if (!browserAllowed) return false;
    return incrementLimit(db, limits, ipIdentity, LIKE_LIMIT_PER_IP);
  }
  if (!context.browserId) {
    // Without a browser identifier, the strict per-IP limit is the only bucket.
    return incrementLimit(
      db,
      limits,
      createSubmissionIpIdentity(ip, window),
      SUBMISSION_LIMIT_PER_BROWSER,
    );
  }
  const browserAllowed = await incrementLimit(
    db,
    limits,
    createSubmissionBrowserIdentity(context.browserId, window),
    SUBMISSION_LIMIT_PER_BROWSER,
  );
  if (!browserAllowed) return false;
  return incrementLimit(
    db,
    limits,
    createSubmissionIpIdentity(ip, window),
    SUBMISSION_LIMIT_PER_IP,
  );
}
