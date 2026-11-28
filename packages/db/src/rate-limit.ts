import { lt, lte, sql } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type { createDatabase } from "./client";

type Database = ReturnType<typeof createDatabase>;

export type RateLimitTable = SQLiteTable & {
  key: SQLiteColumn;
  count: SQLiteColumn;
  expiresAt: SQLiteColumn;
};

export type ConsumeRateLimitInput = {
  secret: string;
  identity: string;
  limit: number;
  now: number;
  expiresAt: number;
};

function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Derives an HMAC-SHA256 hex bucket key so raw IPs, emails, or browser IDs
 * are never stored in D1 rate-limit tables.
 */
export async function deriveRateLimitKey(secret: string, identity: string): Promise<string> {
  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", signingKey, encoder.encode(identity));
  return encodeHex(new Uint8Array(signature));
}

/**
 * Atomically consumes one unit from an HMAC-keyed D1 rate-limit bucket,
 * pruning expired buckets first. Returns true when within `limit`, false
 * once the bucket is exhausted.
 */
export async function consumeRateLimit(
  db: Database,
  table: RateLimitTable,
  input: ConsumeRateLimitInput,
): Promise<boolean> {
  const key = await deriveRateLimitKey(input.secret, input.identity);
  await db.delete(table).where(lte(table.expiresAt, input.now));
  const [allowed] = await db
    .insert(table)
    .values({ key, count: 1, expiresAt: input.expiresAt })
    .onConflictDoUpdate({
      target: table.key,
      set: { count: sql`${table.count} + 1` },
      setWhere: lt(table.count, input.limit),
    })
    .returning({ count: table.count });
  return allowed !== undefined;
}
