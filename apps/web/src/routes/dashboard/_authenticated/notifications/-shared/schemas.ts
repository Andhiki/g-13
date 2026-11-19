import { z } from "zod";

export const notificationFilterSchema = z.enum(["all", "unread", "archived"]);
export type NotificationFilter = z.infer<typeof notificationFilterSchema>;

export const notificationsPageSchema = z.object({
  offset: z.number().int().min(0).default(0),
  filter: notificationFilterSchema.default("all"),
});
export type NotificationsPageInput = z.infer<typeof notificationsPageSchema>;

export const notificationIdSchema = z.object({
  notificationId: z.string().trim().min(1).max(128),
});
export type NotificationIdInput = z.infer<typeof notificationIdSchema>;

export type NotificationLinkTarget =
  | { to: "/dashboard/lecturer-reviews"; search?: { review?: string } }
  | { to: "/dashboard/users"; search?: undefined }
  | null;

export function resolveNotificationLink(
  resourceType: string,
  resourceId: string,
): NotificationLinkTarget {
  switch (resourceType) {
    case "lecturer_review":
      return { to: "/dashboard/lecturer-reviews", search: { review: resourceId } };
    case "user":
      return { to: "/dashboard/users" };
    default:
      return null;
  }
}
