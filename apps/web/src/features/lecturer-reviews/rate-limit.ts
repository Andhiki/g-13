import type { createDatabase } from "@g13/db";

type Database = ReturnType<typeof createDatabase>;

export async function allowReviewAction(
  db: Database,
  context: { ip: string; secret: string; now?: number },
  action: "submission" | "like",
): Promise<boolean> {
  const now = context.now ?? Date.now();
  const window = Math.floor(now / 3_600_000);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(context.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const identity =
    action === "submission" ? `${window}:${context.ip}` : `${action}:${window}:${context.ip}`;
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(identity));
  const hash = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  await db.$client
    .prepare("DELETE FROM review_submission_limits WHERE expires_at <= ?")
    .bind(now)
    .run();
  const allowed = await db.$client
    .prepare(`INSERT INTO review_submission_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`)
    .bind(hash, (window + 1) * 3_600_000, action === "submission" ? 3 : 60)
    .first();
  return Boolean(allowed);
}
