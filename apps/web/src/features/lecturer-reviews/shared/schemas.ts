import { z } from "zod";
import { submissionInputSchema } from "./submission-schema";

const browserIdSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

export const lecturerDetailInputSchema = z.object({ lecturerId: z.string().min(1) });
export const browserLikesInputSchema = z.object({ browserId: browserIdSchema });
export const reviewLikeInputSchema = z.object({
  reviewId: z.string().min(1),
  browserId: browserIdSchema,
  liked: z.boolean(),
});
export type ReviewLikeInput = z.output<typeof reviewLikeInputSchema>;

export const publishReviewInputSchema = submissionInputSchema;

export function validateRpcInput<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? { valid: true as const, data: result.data } : { valid: false as const };
}
