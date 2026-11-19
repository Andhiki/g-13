import { z } from "zod";

export const adminPageSchema = z.object({ offset: z.number().int().min(0) });

export const reviewStatusSchema = z.enum(["all", "published", "hidden", "deleted"]);
export const moderationPageSchema = adminPageSchema.extend({ status: reviewStatusSchema });
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export const moderationReviewSchema = z.object({ reviewId: z.string().trim().min(1).max(100) });
