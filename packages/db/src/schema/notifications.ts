import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { authUser } from "./auth";

export type NotificationPayloadValue = string | number | boolean | null;
export type NotificationPayload = Record<string, NotificationPayloadValue>;

export const notificationEvents = sqliteTable(
  "notification_events",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    actorId: text("actor_id").references(() => authUser.id, { onDelete: "set null" }),
    payload: text("payload", { mode: "json" })
      .$type<NotificationPayload>()
      .notNull()
      .default(sql`'{}'`),
    dedupeKey: text("dedupe_key"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("notification_events_resource_idx").on(table.resourceType, table.resourceId),
    uniqueIndex("notification_events_dedupe_key_unique").on(table.dedupeKey),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => notificationEvents.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("notifications_inbox_idx").on(
      table.recipientId,
      table.archivedAt,
      table.readAt,
      table.createdAt,
    ),
    uniqueIndex("notifications_event_recipient_unique").on(table.eventId, table.recipientId),
  ],
);
