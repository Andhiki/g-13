import type { createDatabase } from "@g13/db/client";
import { NOTIFICATION_ERRORS, type NotificationOperationResult } from "../-shared/errors";
import type { NotificationViewer } from "../-shared/audience";
import type { NotificationCursor, NotificationFilter } from "../-shared/schemas";
import {
  archiveNotification,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = NotificationViewer;

export type NotificationListData = {
  rows: NotificationItem[];
  nextCursor: NotificationCursor | null;
};

export async function inspectNotifications(
  db: Database,
  actor: Actor,
  cursor: NotificationCursor | null = null,
  filter: NotificationFilter = "all",
): Promise<NotificationOperationResult<NotificationListData>> {
  const page = await listUserNotifications(db, actor, cursor, filter);
  return { data: page, error: null };
}

export async function readNotification(
  db: Database,
  actor: Actor,
  notificationId: string,
  now?: number,
): Promise<NotificationOperationResult<{ notificationId: string }>> {
  const updated = await markNotificationRead(db, actor, notificationId, now);
  if (!updated) return { data: null, error: NOTIFICATION_ERRORS.NOT_FOUND };
  return { data: { notificationId }, error: null };
}

export async function readAllNotifications(
  db: Database,
  actor: Actor,
  now?: number,
): Promise<NotificationOperationResult<{ ok: true }>> {
  await markAllNotificationsRead(db, actor, now);
  return { data: { ok: true }, error: null };
}

export async function archiveUserNotification(
  db: Database,
  actor: Actor,
  notificationId: string,
  now?: number,
): Promise<NotificationOperationResult<{ notificationId: string }>> {
  const archived = await archiveNotification(db, actor, notificationId, now);
  if (!archived) return { data: null, error: NOTIFICATION_ERRORS.NOT_FOUND };
  return { data: { notificationId }, error: null };
}
