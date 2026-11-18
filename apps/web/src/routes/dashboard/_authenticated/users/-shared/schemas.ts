import { z } from "zod";

export const userStatusSchema = z.enum(["all", "pending", "approved"]);
export const userPageSchema = z.object({
  offset: z.number().int().min(0),
  status: userStatusSchema,
});
export type UserStatus = z.infer<typeof userStatusSchema>;

export const assignRoleSchema = z.object({
  userId: z.string().trim().min(1).max(100),
  role: z.enum(["user", "maintainer", "admin"]),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
