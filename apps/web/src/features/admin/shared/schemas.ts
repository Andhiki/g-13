import { z } from "zod";

export const adminPageSchema = z.object({ offset: z.number().int().min(0) });

export const reviewStatusSchema = z.enum(["all", "published", "hidden", "deleted"]);
export const moderationPageSchema = adminPageSchema.extend({ status: reviewStatusSchema });
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const userStatusSchema = z.enum(["all", "pending", "approved"]);
export const userPageSchema = adminPageSchema.extend({ status: userStatusSchema });
export type UserStatus = z.infer<typeof userStatusSchema>;

export const assignRoleSchema = z.object({
  userId: z.string().trim().min(1).max(100),
  role: z.enum(["user", "maintainer", "admin"]),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
