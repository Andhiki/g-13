import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const learningResources = sqliteTable(
  "learning_resources",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id").notNull(),
    titleEn: text("title_en").notNull(),
    descriptionId: text("description_id").notNull(),
    descriptionEn: text("description_en").notNull(),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("learning_resources_visible_idx").on(table.deletedAt, table.sortOrder),
    check("learning_resources_url_scheme", sql`${table.url} like 'https://%'`),
  ],
);
