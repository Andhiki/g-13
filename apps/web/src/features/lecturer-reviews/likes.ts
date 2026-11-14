import { reviewLikes, reviews, type createDatabase } from "@g13/db";
import { and, eq, isNull } from "drizzle-orm";
import { allowReviewAction } from "./rate-limit";

type Database = ReturnType<typeof createDatabase>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getBrowserLikes(db: Database, browserId: string): Promise<string[]> {
  if (!uuid.test(browserId)) return [];
  const rows = await db
    .select({ reviewId: reviewLikes.reviewId })
    .from(reviewLikes)
    .where(eq(reviewLikes.browserId, browserId));
  return rows.map((row) => row.reviewId);
}

export async function setReviewLike(
  db: Database,
  input: { reviewId: string; browserId: string; liked: boolean },
  context: { enabled: boolean; ip: string | null; secret: string; now?: number },
) {
  if (!context.enabled || !context.ip || context.secret.length < 32)
    return { ok: false as const, error: "unavailable" as const };
  if (
    typeof input?.reviewId !== "string" ||
    typeof input.browserId !== "string" ||
    !uuid.test(input.browserId) ||
    typeof input.liked !== "boolean"
  )
    return { ok: false as const, error: "invalid" as const };
  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.id, input.reviewId),
        eq(reviews.status, "published"),
        isNull(reviews.deletedAt),
      ),
    );
  if (!review) return { ok: false as const, error: "invalid" as const };
  if (!(await allowReviewAction(db, { ...context, ip: context.ip }, "like")))
    return { ok: false as const, error: "rate-limit" as const };
  if (input.liked)
    await db
      .insert(reviewLikes)
      .values({ reviewId: input.reviewId, browserId: input.browserId })
      .onConflictDoNothing();
  else
    await db
      .delete(reviewLikes)
      .where(
        and(eq(reviewLikes.reviewId, input.reviewId), eq(reviewLikes.browserId, input.browserId)),
      );
  return { ok: true as const };
}
