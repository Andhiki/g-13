import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  nameId: text("name_id").notNull(),
  nameEn: text("name_en").notNull(),
});
