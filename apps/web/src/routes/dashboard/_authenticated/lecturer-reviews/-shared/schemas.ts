import { z } from "zod";
import { adminPageSchema } from "../../-shared/admin-search";

export const reviewStatusSchema = z.enum(["all", "pending", "published", "hidden", "deleted"]);
export const moderationPageSchema = adminPageSchema.extend({ status: reviewStatusSchema });
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
const nonEmpty = z.string().trim().min(1);
const requiredId = () => nonEmpty.max(100);

export const moderationReviewSchema = z.object({ reviewId: requiredId() });

/** Fields the admin search matches; the UI may highlight only these. */
export const reviewSearchFields = [
  "lecturerName",
  "courseCode",
  "courseNameId",
  "courseNameEn",
  "termLabel",
  "authorName",
  "body",
] as const;
