import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { theses } from "./theses";

export const thesisFields = sqliteTable(
  "thesis_fields",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    lab: text("lab").notNull(),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("thesis_fields_lab_position_idx").on(table.lab, table.position),
    check("thesis_fields_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("thesis_fields_lab_not_empty", sql`length(trim(${table.lab})) > 0`),
    check("thesis_fields_position_valid", sql`${table.position} >= 0`),
  ],
);

export const thesisFieldLinks = sqliteTable(
  "thesis_field_links",
  {
    thesisId: text("thesis_id")
      .notNull()
      .references(() => theses.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => thesisFields.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.thesisId, table.fieldId] }),
    index("thesis_field_links_field_idx").on(table.fieldId),
  ],
);
