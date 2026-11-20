import { and, eq, inArray, lt, notExists } from "drizzle-orm";
import type { Role } from "@g13/auth";
import { authUser } from "@g13/db/schema/auth";
import {
  notificationEvents,
  notifications,
  type NotificationPayload,
} from "@g13/db/schema/notifications";
import type { createDatabase } from "@g13/db/client";

type Database = ReturnType<typeof createDatabase>;

export type NotificationRecipients = {
  userIds?: readonly string[];
  roles?: readonly Role[];
  excludeUserIds?: readonly string[];
};

export type DispatchNotificationInput = {
  type: string;
  resourceType: string;
  resourceId: string;
  payload?: NotificationPayload;
  actorId?: string | null;
  dedupeKey?: string | null;
  recipients: NotificationRecipients;
  now?: number;
};

export type DispatchNotificationResult = {
  eventId: string | null;
  recipientCount: number;
  deduplicated: boolean;
};

async function resolveRecipientIds(
  db: Database,
  recipients: NotificationRecipients,
): Promise<string[]> {
  const excluded = new Set(recipients.excludeUserIds ?? []);
  const ids = new Set<string>();

  for (const id of recipients.userIds ?? []) {
    if (id && !excluded.has(id)) ids.add(id);
  }

  if (recipients.roles && recipients.roles.length > 0) {
    const matched = await db
      .select({ id: authUser.id })
      .from(authUser)
      .where(inArray(authUser.role, [...recipients.roles]));
    for (const row of matched) {
      if (!excluded.has(row.id)) ids.add(row.id);
    }
  }

  return [...ids];
}

export async function dispatchNotification(
  db: Database,
  input: DispatchNotificationInput,
): Promise<DispatchNotificationResult> {
  if (input.dedupeKey) {
    const [existing] = await db
      .select({ id: notificationEvents.id })
      .from(notificationEvents)
      .where(eq(notificationEvents.dedupeKey, input.dedupeKey))
      .limit(1);
    if (existing) {
      return { eventId: existing.id, recipientCount: 0, deduplicated: true };
    }
  }

  const recipientIds = await resolveRecipientIds(db, input.recipients);
  if (recipientIds.length === 0) {
    return { eventId: null, recipientCount: 0, deduplicated: false };
  }

  const eventId = crypto.randomUUID();
  const createdAt = new Date(input.now ?? Date.now());
  const eventInsert = db
    .insert(notificationEvents)
    .values({
      id: eventId,
      type: input.type,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      actorId: input.actorId ?? null,
      payload: input.payload ?? {},
      dedupeKey: input.dedupeKey ?? null,
      createdAt,
    })
    .onConflictDoNothing();

  const notificationInserts = recipientIds.map((recipientId) =>
    db
      .insert(notifications)
      .values({
        id: crypto.randomUUID(),
        eventId,
        recipientId,
        createdAt,
      })
      .onConflictDoNothing(),
  );

  await db.batch([eventInsert, ...notificationInserts]);

  return { eventId, recipientCount: recipientIds.length, deduplicated: false };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function pruneOldNotifications(
  db: Database,
  options: { olderThanDays?: number; now?: number } = {},
): Promise<{ cutoff: Date }> {
  const olderThanDays = options.olderThanDays ?? 90;
  const cutoff = new Date((options.now ?? Date.now()) - olderThanDays * DAY_MS);

  await db.batch([
    db.delete(notifications).where(lt(notifications.createdAt, cutoff)),
    db
      .delete(notificationEvents)
      .where(
        and(
          lt(notificationEvents.createdAt, cutoff),
          notExists(
            db
              .select({ id: notifications.id })
              .from(notifications)
              .where(eq(notifications.eventId, notificationEvents.id)),
          ),
        ),
      ),
  ]);

  return { cutoff };
}
