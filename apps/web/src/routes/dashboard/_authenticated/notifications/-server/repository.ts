import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import {
  notificationEvents,
  notifications,
  type NotificationPayload,
} from "@g13/db/schema/notifications";
import type { createDatabase } from "@g13/db/client";
import { hiddenNotificationTypes, type NotificationViewer } from "../-shared/audience";
import type { NotificationCursor, NotificationFilter } from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

const NOTIFICATIONS_PAGE_SIZE = 50;

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

function visibleTo(viewer: NotificationViewer): SQL | undefined {
  const hidden = hiddenNotificationTypes(viewer.role);
  return and(
    eq(notifications.recipientId, viewer.id),
    hidden.length ? notInArray(notificationEvents.type, hidden) : undefined,
  );
}

// Visible notification ids for single-row mutations, which cannot join in an UPDATE.
function visibleNotificationIds(db: Database, viewer: NotificationViewer) {
  return db
    .select({ id: notifications.id })
    .from(notifications)
    .innerJoin(notificationEvents, eq(notifications.eventId, notificationEvents.id))
    .where(visibleTo(viewer));
}

function filterCondition(viewer: NotificationViewer, filter: NotificationFilter) {
  switch (filter) {
    case "unread":
      return and(visibleTo(viewer), isNull(notifications.archivedAt), isNull(notifications.readAt));
    case "archived":
      return and(visibleTo(viewer), isNotNull(notifications.archivedAt));
    case "all":
      return and(visibleTo(viewer), isNull(notifications.archivedAt));
  }
}

export async function listUserNotifications(
  db: Database,
  viewer: NotificationViewer,
  cursor: NotificationCursor | null,
  filter: NotificationFilter,
): Promise<{ rows: NotificationItem[]; nextCursor: NotificationCursor | null }> {
  const before = cursor
    ? or(
        lt(notifications.createdAt, new Date(cursor.createdAt)),
        and(
          eq(notifications.createdAt, new Date(cursor.createdAt)),
          lt(notifications.id, cursor.id),
        ),
      )
    : undefined;
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
    .where(and(filterCondition(viewer, filter), before))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(NOTIFICATIONS_PAGE_SIZE + 1);

  const page = rows.slice(0, NOTIFICATIONS_PAGE_SIZE).map((row) => ({
    ...row,
    payload: row.payload ?? {},
    readAt: row.readAt ? row.readAt.getTime() : null,
    archivedAt: row.archivedAt ? row.archivedAt.getTime() : null,
    createdAt: row.createdAt.getTime(),
  }));
  const last = page.at(-1);
  return {
    rows: page,
    nextCursor:
      last && rows.length > page.length ? { createdAt: last.createdAt, id: last.id } : null,
  };
}

export async function markNotificationRead(
  db: Database,
  viewer: NotificationViewer,
  notificationId: string,
  now = Date.now(),
): Promise<boolean> {
  const [existing] = await db
    .select({ id: notifications.id, readAt: notifications.readAt })
    .from(notifications)
    .innerJoin(notificationEvents, eq(notifications.eventId, notificationEvents.id))
    .where(and(eq(notifications.id, notificationId), visibleTo(viewer)))
    .limit(1);

  if (!existing) return false;
  if (existing.readAt !== null) return true;

  await db
    .update(notifications)
    .set({ readAt: new Date(now) })
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, viewer.id)));
  return true;
}

export async function markAllNotificationsRead(
  db: Database,
  viewer: NotificationViewer,
  now = Date.now(),
): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date(now) })
    .where(
      and(
        isNull(notifications.archivedAt),
        isNull(notifications.readAt),
        inArray(notifications.id, visibleNotificationIds(db, viewer)),
      ),
    );
}

export async function archiveNotification(
  db: Database,
  viewer: NotificationViewer,
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
    .innerJoin(notificationEvents, eq(notifications.eventId, notificationEvents.id))
    .where(and(eq(notifications.id, notificationId), visibleTo(viewer)))
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
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, viewer.id)));
  return true;
}
