import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { authUser } from "./auth";

export const announcements = sqliteTable(
  "announcements",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id").notNull(),
    titleEn: text("title_en").notNull(),
    bodyId: text("body_id").notNull(),
    bodyEn: text("body_en").notNull(),
    ctaHref: text("cta_href"),
    ctaLabelId: text("cta_label_id"),
    ctaLabelEn: text("cta_label_en"),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    countdownAt: integer("countdown_at", { mode: "timestamp_ms" }),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdById: text("created_by_id").references(() => authUser.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    check(
      "announcements_window",
      sql`${table.endsAt} is null or ${table.endsAt} > ${table.startsAt}`,
    ),
  ],
);
