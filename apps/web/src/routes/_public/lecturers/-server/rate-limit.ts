import type { createDatabase } from "@g13/db/client";
import { REVIEW_RATE_LIMIT_WINDOW_MS, reviewRateLimitResetAt } from "../-shared/rate-limit-window";
import { incrementReviewActionLimit } from "./repository";

type Database = ReturnType<typeof createDatabase>;

const SUBMISSION_LIMIT_PER_BROWSER = 3;
const SUBMISSION_LIMIT_PER_IP = 20;
const LIKE_LIMIT_PER_IP = 60;

function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createSubmissionBrowserIdentity(browserId: string, window: number) {
  return `submission:browser:${window}:${browserId.toLowerCase()}`;
}

function createSubmissionIpIdentity(ip: string, window: number) {
  return `submission:ip:${window}:${ip}`;
}

function createLikeIpIdentity(ip: string, window: number) {
  return `like:${window}:${ip}`;
}

async function deriveReviewActionKey(secret: string, identity: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(identity));
  return encodeHex(new Uint8Array(signature));
}

async function incrementLimit(
  db: Database,
  context: { secret: string; now: number },
  identity: string,
  limit: number,
): Promise<boolean> {
  const key = await deriveReviewActionKey(context.secret, identity);
  return incrementReviewActionLimit(db, {
    key,
    now: context.now,
    expiresAt: reviewRateLimitResetAt(context.now),
    limit,
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
  if (action === "like") {
    return incrementLimit(db, limits, createLikeIpIdentity(context.ip, window), LIKE_LIMIT_PER_IP);
  }
  if (!context.browserId) {
    // Without a browser identifier, the strict per-IP limit is the only bucket.
    return incrementLimit(
      db,
      limits,
      createSubmissionIpIdentity(context.ip, window),
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
    createSubmissionIpIdentity(context.ip, window),
    SUBMISSION_LIMIT_PER_IP,
  );
}
