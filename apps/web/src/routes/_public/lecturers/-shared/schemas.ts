import { z } from "zod";
import { defaultReviewOrder, reviewOrders } from "./review-order";
import { submissionInputSchema } from "./submission-schema";

const trimmedText = (max: number) => z.string().trim().max(max);

const browserIdSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

const coursePickerCursorSchema = z.object({
  name: z.string().min(1).max(200),
  id: z.string().min(1).max(128),
});
export type CoursePickerCursor = z.infer<typeof coursePickerCursorSchema>;

export const coursePickerInputSchema = z.object({
  cursor: coursePickerCursorSchema.nullable().default(null),
  query: trimmedText(120).default(""),
  language: z.enum(["id", "en"]),
});
export type CoursePickerInput = z.infer<typeof coursePickerInputSchema>;

export const lecturerDetailInputSchema = z.object({ lecturerId: z.string().min(1) });
const lecturerReviewCursorSchema = z.object({
  id: z.string().min(1),
  createdAt: z.number().int(),
  rating: z.number().int().min(3).max(15),
});
export type LecturerReviewCursor = z.infer<typeof lecturerReviewCursorSchema>;

export const lecturerReviewsInputSchema = lecturerDetailInputSchema.extend({
  courseId: z.string().min(1).nullable().default(null),
  order: z.enum(reviewOrders).default(defaultReviewOrder),
  cursor: lecturerReviewCursorSchema.nullable().default(null),
});
export type LecturerReviewsInput = z.infer<typeof lecturerReviewsInputSchema>;

export const pendingReviewIdSchema = browserIdSchema;
export const pendingReviewBatchSize = 90;
export const ownPendingReviewsInputSchema = lecturerDetailInputSchema.extend({
  reviewIds: z.array(pendingReviewIdSchema).min(1).max(pendingReviewBatchSize),
});
export const browserLikesInputSchema = z.object({ browserId: browserIdSchema });
export const reviewLikeInputSchema = z.object({
  reviewId: z.string().min(1),
  browserId: browserIdSchema,
  liked: z.boolean(),
});
export type ReviewLikeInput = z.output<typeof reviewLikeInputSchema>;

export const publishReviewInputSchema = submissionInputSchema.and(
  z.object({
    browserId: browserIdSchema.nullable().optional(),
    turnstileToken: trimmedText(2048).min(1),
  }),
);
