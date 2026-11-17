import type { createDatabase } from "@g13/db";
import { incrementReviewActionLimit } from "./repository";

type Database = ReturnType<typeof createDatabase>;

function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createReviewActionIdentity(action: "submission" | "like", ip: string, window: number) {
  return `${action}:${window}:${ip}`;
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

export async function allowReviewAction(
  db: Database,
  context: { ip: string; secret: string; now?: number },
  action: "submission" | "like",
): Promise<boolean> {
  const now = context.now ?? Date.now();
  const window = Math.floor(now / 3_600_000);
  const key = await deriveReviewActionKey(
    context.secret,
    createReviewActionIdentity(action, context.ip, window),
  );
  return incrementReviewActionLimit(db, {
    key,
    now,
    expiresAt: (window + 1) * 3_600_000,
    limit: action === "submission" ? 3 : 60,
  });
}
