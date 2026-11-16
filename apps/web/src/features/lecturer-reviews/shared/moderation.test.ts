import { expect, it } from "bun:test";
import { moderateReviewSchema } from "./moderation";

it("validates moderation actions and review identity at the trust boundary", () => {
  expect(moderateReviewSchema.parse({ reviewId: " review-one ", action: "hide" })).toEqual({
    reviewId: "review-one",
    action: "hide",
  });
  for (const input of [
    {},
    { reviewId: " ", action: "restore" },
    { reviewId: "x".repeat(101), action: "delete" },
    { reviewId: "review-one", action: "publish" },
  ]) {
    expect(moderateReviewSchema.safeParse(input).success).toBe(false);
  }
});
