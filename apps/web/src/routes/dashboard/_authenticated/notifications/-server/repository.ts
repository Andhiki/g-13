import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import {
  notificationEvents,
  notifications,
  type createDatabase,
  type NotificationPayload,
} from "@g13/db";
import type { NotificationFilter } from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

export const NOTIFICATIONS_PAGE_SIZE = 50;

export type NotificationItem = {
  id: string;
  eventId: string;
  type: string;
  resourceType: string;
  resourceId: string;
  actorId: string | null;
  payload: NotificationPayload;
  readAt: number | null;
  archivedAt: number | null;
  createdAt: number;
};

export type NotificationCounts = {
  all: number;
  unread: number;
  archived: number;
};

function filterCondition(recipientId: string, filter: NotificationFilter) {
  switch (filter) {
    case "unread":
      return and(
        eq(notifications.recipientId, recipientId),
        isNull(notifications.archivedAt),
        isNull(notifications.readAt),
      );
    case "archived":
      return and(eq(notifications.recipientId, recipientId), isNotNull(notifications.archivedAt));
    case "all":
      return and(eq(notifications.recipientId, recipientId), isNull(notifications.archivedAt));
  }
}

export async function listUserNotifications(
  db: Database,
  recipientId: string,
  offset = 0,
  filter: NotificationFilter = "all",
  limit = NOTIFICATIONS_PAGE_SIZE,
): Promise<NotificationItem[]> {
  const rows = await db
    .select({
      id: notifications.id,
      eventId: notifications.eventId,
      type: notificationEvents.type,
      resourceType: notificationEvents.resourceType,
      resourceId: notificationEvents.resourceId,
      actorId: notificationEvents.actorId,
      payload: notificationEvents.payload,
      readAt: notifications.readAt,
      archivedAt: notifications.archivedAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(notificationEvents, eq(notifications.eventId, notificationEvents.id))
    .where(filterCondition(recipientId, filter))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit + 1)
    .offset(offset);

  return rows.map((row) => ({
    ...row,
    payload: row.payload ?? {},
    readAt: row.readAt ? row.readAt.getTime() : null,
    archivedAt: row.archivedAt ? row.archivedAt.getTime() : null,
    createdAt: row.createdAt.getTime(),
  }));
}

export async function getNotificationCounts(
  db: Database,
  recipientId: string,
): Promise<NotificationCounts> {
  const [row] = await db
    .select({
      all: sql<number>`coalesce(sum(case when ${notifications.archivedAt} is null then 1 else 0 end), 0)`,
      unread: sql<number>`coalesce(sum(case when ${notifications.archivedAt} is null and ${notifications.readAt} is null then 1 else 0 end), 0)`,
      archived: sql<number>`coalesce(sum(case when ${notifications.archivedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(notifications)
    .where(eq(notifications.recipientId, recipientId));

  return {
    all: Number(row?.all ?? 0),
    unread: Number(row?.unread ?? 0),
    archived: Number(row?.archived ?? 0),
  };
}

export async function countUnreadNotifications(db: Database, recipientId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, recipientId),
        isNull(notifications.archivedAt),
        isNull(notifications.readAt),
      ),
    );
  return Number(row?.count ?? 0);
}

export async function markNotificationRead(
  db: Database,
  recipientId: string,
  notificationId: string,
  now = Date.now(),
): Promise<boolean> {
  const [existing] = await db
    .select({ id: notifications.id, readAt: notifications.readAt })
    .from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, recipientId)))
    .limit(1);

  if (!existing) return false;
  if (existing.readAt !== null) return true;

  await db
    .update(notifications)
    .set({ readAt: new Date(now) })
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, recipientId)));
  return true;
}

export async function markAllNotificationsRead(
  db: Database,
  recipientId: string,
  now = Date.now(),
): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date(now) })
    .where(
      and(
        eq(notifications.recipientId, recipientId),
        isNull(notifications.archivedAt),
        isNull(notifications.readAt),
      ),
    );
}

export async function archiveNotification(
  db: Database,
  recipientId: string,
  notificationId: string,
  now = Date.now(),
): Promise<boolean> {
  const [existing] = await db
    .select({
      id: notifications.id,
      readAt: notifications.readAt,
      archivedAt: notifications.archivedAt,
    })
    .from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, recipientId)))
    .limit(1);

  if (!existing) return false;
  if (existing.archivedAt !== null) return true;

  const timestamp = new Date(now);
  await db
    .update(notifications)
    .set({
      archivedAt: timestamp,
      readAt: existing.readAt ?? timestamp,
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, recipientId)));
  return true;
}
