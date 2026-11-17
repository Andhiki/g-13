import { z } from "zod";

export const moderateReviewSchema = z.object({
  reviewId: z.string().trim().min(1).max(100),
  action: z.enum(["hide", "restore", "delete"]),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
