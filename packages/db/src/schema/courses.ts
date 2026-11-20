import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    nameId: text("name_id").notNull(),
    nameEn: text("name_en").notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("courses_deleted_idx").on(table.deletedAt)],
);
