import type { createDatabase } from "@g13/db";
import { allowReviewAction } from "./rate-limit";
import { addReviewLike, getVisibleReviewId, removeReviewLike } from "./repository";
import type { ReviewLikeInput } from "../shared/schemas";

type Database = ReturnType<typeof createDatabase>;

export async function setReviewLike(
  db: Database,
  input: ReviewLikeInput,
  context: { ip: string | null; secret: string; now?: number },
) {
  const ip = context.ip;
  if (!ip) return { ok: false as const, error: "unavailable" as const };
  if (!(await getVisibleReviewId(db, input.reviewId)))
    return { ok: false as const, error: "invalid" as const };
  if (!(await allowReviewAction(db, { ...context, ip }, "like")))
    return { ok: false as const, error: "rate-limit" as const };
  const { reviewId, browserId } = input;
  if (input.liked) await addReviewLike(db, { reviewId, browserId });
  else await removeReviewLike(db, { reviewId, browserId });
  return { ok: true as const };
}
