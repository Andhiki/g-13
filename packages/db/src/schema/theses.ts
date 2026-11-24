import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { lecturers } from "./lecturers";

export const thesisTypes = [
  "skripsi",
  "product-innovation",
  "collaborative-project",
  "industry-project",
  "scientific-publication",
] as const;

export const thesisStatuses = ["draft", "published", "hidden"] as const;
export const thesisLanguages = ["id", "en"] as const;
export const thesisContactChannels = ["email", "url"] as const;
export const thesisSupervisorRoles = ["main", "co"] as const;

export type ThesisType = (typeof thesisTypes)[number];
export type ThesisStatus = (typeof thesisStatuses)[number];
export type ThesisLanguage = (typeof thesisLanguages)[number];
export type ThesisContactChannel = (typeof thesisContactChannels)[number];
export type ThesisSupervisorRole = (typeof thesisSupervisorRoles)[number];

export const theses = sqliteTable(
  "theses",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    abstract: text("abstract"),
    abstractEn: text("abstract_en"),
    authorName: text("author_name").notNull(),
    authorBatch: integer("author_batch"),
    year: integer("year").notNull(),
    type: text("type", { enum: thesisTypes }).notNull().default("skripsi"),
    language: text("language", { enum: thesisLanguages }).notNull().default("id"),
    repositoryUrl: text("repository_url"),
    contactChannel: text("contact_channel", { enum: thesisContactChannels }),
    contactValue: text("contact_value"),
    abstractPublic: integer("abstract_public", { mode: "boolean" }).notNull().default(false),
    contactPublic: integer("contact_public", { mode: "boolean" }).notNull().default(false),
    consentAt: integer("consent_at", { mode: "timestamp_ms" }),
    consentSource: text("consent_source"),
    status: text("status", { enum: thesisStatuses }).notNull().default("draft"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("theses_status_deleted_year_idx").on(table.status, table.deletedAt, table.year),
    check("theses_title_not_empty", sql`length(trim(${table.title})) > 0`),
    check("theses_author_name_not_empty", sql`length(trim(${table.authorName})) > 0`),
    check("theses_year_range", sql`${table.year} between 1945 and 2100`),
    check(
      "theses_author_batch_range",
      sql`${table.authorBatch} is null or ${table.authorBatch} between 1945 and 2100`,
    ),
    check(
      "theses_type_valid",
      sql`${table.type} in ('skripsi', 'product-innovation', 'collaborative-project', 'industry-project', 'scientific-publication')`,
    ),
    check("theses_language_valid", sql`${table.language} in ('id', 'en')`),
    check("theses_status_valid", sql`${table.status} in ('draft', 'published', 'hidden')`),
    check(
      "theses_contact_channel_valid",
      sql`${table.contactChannel} is null or ${table.contactChannel} in ('email', 'url')`,
    ),
    check(
      "theses_abstract_public_content",
      sql`${table.abstractPublic} = 0 or (length(trim(coalesce(${table.abstract}, ''))) > 0 or length(trim(coalesce(${table.abstractEn}, ''))) > 0)`,
    ),
    check(
      "theses_contact_public_content",
      sql`${table.contactPublic} = 0 or (${table.contactChannel} is not null and ${table.contactValue} is not null and length(trim(${table.contactValue})) > 0)`,
    ),
    check(
      "theses_consent_required",
      sql`(${table.abstractPublic} = 0 and ${table.contactPublic} = 0) or ${table.consentAt} is not null`,
    ),
    check(
      "theses_published_consent",
      sql`${table.status} != 'published' or (${table.consentAt} is not null and ${table.consentSource} is not null)`,
    ),
  ],
);

export const thesisSupervisors = sqliteTable(
  "thesis_supervisors",
  {
    thesisId: text("thesis_id")
      .notNull()
      .references(() => theses.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    lecturerId: text("lecturer_id").references(() => lecturers.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    role: text("role", { enum: thesisSupervisorRoles }),
  },
  (table) => [
    primaryKey({ columns: [table.thesisId, table.position] }),
    index("thesis_supervisors_lecturer_idx").on(table.lecturerId),
    check("thesis_supervisors_position_valid", sql`${table.position} >= 0`),
    check("thesis_supervisors_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check(
      "thesis_supervisors_role_valid",
      sql`${table.role} is null or ${table.role} in ('main', 'co')`,
    ),
  ],
);

export const thesisKeywords = sqliteTable(
  "thesis_keywords",
  {
    thesisId: text("thesis_id")
      .notNull()
      .references(() => theses.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.thesisId, table.keyword] }),
    index("thesis_keywords_keyword_idx").on(table.keyword),
    check("thesis_keywords_not_empty", sql`length(trim(${table.keyword})) > 0`),
  ],
);
