import { lt, lte, sql } from "drizzle-orm";
import { authRateLimits, type createDatabase } from "@g13/db";

type Database = ReturnType<typeof createDatabase>;

export async function consumeAuthLimit(
  db: Database,
  secret: string,
  key: string,
  rule: { window: number; max: number },
): Promise<{ allowed: boolean; retryAfter: number | null }> {
  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    signingKey,
    encoder.encode(`auth-rate-limit:${key}`),
  );
  const hashedKey = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const now = Date.now();
  const expiresAt = now + rule.window * 1000;
  await db.delete(authRateLimits).where(lte(authRateLimits.expiresAt, now));
  const [allowed] = await db
    .insert(authRateLimits)
    .values({ key: hashedKey, count: 1, expiresAt })
    .onConflictDoUpdate({
      target: authRateLimits.key,
      set: { count: sql`${authRateLimits.count} + 1` },
      setWhere: lt(authRateLimits.count, rule.max),
    })
    .returning({ expiresAt: authRateLimits.expiresAt });
  return { allowed: allowed !== undefined, retryAfter: allowed ? null : rule.window };
}
