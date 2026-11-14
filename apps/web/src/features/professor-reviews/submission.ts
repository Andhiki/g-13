import { courses, professors, reviews, type createDatabase } from "@g13/db";
import { eq } from "drizzle-orm";

import { validateSubmission, type ReviewSubmission } from "./submission-validation";

type Database = ReturnType<typeof createDatabase>;
export { validateSubmission } from "./submission-validation";
export type SubmissionResult =
  | { ok: true; reviewId: string }
  | { ok: false; error: "invalid" | "unavailable" | "rate-limit" };

export async function submitReview(
  db: Database,
  input: unknown,
  context: {
    enabled: boolean;
    ip: string | null;
    secret: string;
    now?: number;
  },
): Promise<SubmissionResult> {
  if (!context.enabled || !context.ip || context.secret.length < 32)
    return { ok: false, error: "unavailable" };
  let review: ReviewSubmission;
  try {
    review = validateSubmission(input);
  } catch {
    return { ok: false, error: "invalid" };
  }
  const [professor] = await db
    .select()
    .from(professors)
    .where(eq(professors.id, review.professorId));
  const [course] = await db.select().from(courses).where(eq(courses.id, review.courseId));
  if (!professor || !course) return { ok: false, error: "invalid" };
  const now = context.now ?? Date.now();
  const window = Math.floor(now / 3_600_000);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(context.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${window}:${context.ip}`),
  );
  const hash = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  await db.$client
    .prepare("DELETE FROM review_submission_limits WHERE expires_at <= ?")
    .bind(now)
    .run();
  const allowed = await db.$client
    .prepare(`INSERT INTO review_submission_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1 WHERE count < 3 RETURNING count`)
    .bind(hash, (window + 1) * 3_600_000)
    .first();
  if (!allowed) return { ok: false, error: "rate-limit" };
  const { anonymous: _anonymous, ...values } = review;
  const reviewId = crypto.randomUUID();
  await db.insert(reviews).values({ ...values, id: reviewId, status: "published" });
  return { ok: true, reviewId };
}
