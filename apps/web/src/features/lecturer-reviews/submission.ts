import { courses, lecturers, reviews, type createDatabase } from "@g13/db";
import { eq } from "drizzle-orm";

import { allowReviewAction } from "./rate-limit";
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
    ip: string | null;
    secret: string;
    now?: number;
  },
): Promise<SubmissionResult> {
  if (!context.ip || context.secret.length < 32) return { ok: false, error: "unavailable" };
  let review: ReviewSubmission;
  try {
    review = validateSubmission(input);
  } catch {
    return { ok: false, error: "invalid" };
  }
  const [lecturer] = await db.select().from(lecturers).where(eq(lecturers.id, review.lecturerId));
  const [course] = await db.select().from(courses).where(eq(courses.id, review.courseId));
  if (!lecturer || !course) return { ok: false, error: "invalid" };
  if (!(await allowReviewAction(db, { ...context, ip: context.ip }, "submission")))
    return { ok: false, error: "rate-limit" };
  const { anonymous: _anonymous, ...values } = review;
  const reviewId = crypto.randomUUID();
  await db.insert(reviews).values({ ...values, id: reviewId, status: "published" });
  return { ok: true, reviewId };
}
