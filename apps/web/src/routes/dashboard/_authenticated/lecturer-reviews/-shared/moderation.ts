import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const requiredId = () => nonEmpty.max(100);

export const moderateReviewSchema = z.object({
  reviewId: requiredId(),
  action: z.enum(["approve", "hide", "restore", "delete"]),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
