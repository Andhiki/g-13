import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const lecturers = sqliteTable(
  "lecturers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("lecturers_deleted_idx").on(table.deletedAt)],
);
