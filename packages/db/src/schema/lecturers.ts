import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const lecturers = sqliteTable("lecturers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});
