import type { createDatabase } from "@g13/db";
import { NOTIFICATION_ERRORS, type NotificationOperationResult } from "../-shared/errors";
import type { NotificationFilter } from "../-shared/schemas";
import {
  archiveNotification,
  countUnreadNotifications,
  getNotificationCounts,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationCounts,
  type NotificationItem,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string };

export type NotificationListData = {
  rows: NotificationItem[];
  counts: NotificationCounts;
};

export async function inspectNotifications(
  db: Database,
  actor: Actor,
  offset = 0,
  filter: NotificationFilter = "all",
): Promise<NotificationOperationResult<NotificationListData>> {
  const [rows, counts] = await Promise.all([
    listUserNotifications(db, actor.id, offset, filter),
    getNotificationCounts(db, actor.id),
  ]);
  return { data: { rows, counts }, error: null };
}

export async function getUnreadNotificationCount(
  db: Database,
  actor: Actor,
): Promise<NotificationOperationResult<{ unread: number }>> {
  const unread = await countUnreadNotifications(db, actor.id);
  return { data: { unread }, error: null };
}

export async function readNotification(
  db: Database,
  actor: Actor,
  notificationId: string,
  now?: number,
): Promise<NotificationOperationResult<{ notificationId: string }>> {
  const updated = await markNotificationRead(db, actor.id, notificationId, now);
  if (!updated) return { data: null, error: NOTIFICATION_ERRORS.NOT_FOUND };
  return { data: { notificationId }, error: null };
}

export async function readAllNotifications(
  db: Database,
  actor: Actor,
  now?: number,
): Promise<NotificationOperationResult<{ ok: true }>> {
  await markAllNotificationsRead(db, actor.id, now);
  return { data: { ok: true }, error: null };
}

export async function archiveUserNotification(
  db: Database,
  actor: Actor,
  notificationId: string,
  now?: number,
): Promise<NotificationOperationResult<{ notificationId: string }>> {
  const archived = await archiveNotification(db, actor.id, notificationId, now);
  if (!archived) return { data: null, error: NOTIFICATION_ERRORS.NOT_FOUND };
  return { data: { notificationId }, error: null };
}
