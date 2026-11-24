import { and, asc, desc, eq, inArray, isNotNull, isNull, like, sql } from "drizzle-orm";
import type { createDatabase } from "@g13/db/client";
import { lecturers } from "@g13/db/schema/lecturers";
import { thesisFieldLinks, thesisFields } from "@g13/db/schema/thesis-fields";
import { theses, thesisKeywords, thesisSupervisors } from "@g13/db/schema/theses";
import {
  allocateCatalogId,
  slugifyCatalogText,
} from "@/routes/dashboard/_authenticated/-server/slug";
import type {
  CreateThesisInput,
  ThesisLifecycleInput,
  ThesisStatusFilter,
  UpdateThesisInput,
} from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

const thesisColumns = {
  id: theses.id,
  title: theses.title,
  authorName: theses.authorName,
  authorBatch: theses.authorBatch,
  year: theses.year,
  type: theses.type,
  language: theses.language,
  abstract: theses.abstract,
  abstractEn: theses.abstractEn,
  repositoryUrl: theses.repositoryUrl,
  contactChannel: theses.contactChannel,
  contactValue: theses.contactValue,
  abstractPublic: theses.abstractPublic,
  contactPublic: theses.contactPublic,
  consentAt: theses.consentAt,
  consentSource: theses.consentSource,
  status: theses.status,
  createdAt: theses.createdAt,
  updatedAt: theses.updatedAt,
  deletedAt: theses.deletedAt,
};

async function getAdminSupervisors(db: Database, thesisIds: string[]) {
  if (thesisIds.length === 0)
    return new Map<
      string,
      { name: string; lecturerId: string | null; role: "main" | "co" | null }[]
    >();
  const rows = await db
    .select({
      thesisId: thesisSupervisors.thesisId,
      name: thesisSupervisors.name,
      lecturerId: thesisSupervisors.lecturerId,
      role: thesisSupervisors.role,
    })
    .from(thesisSupervisors)
    .where(inArray(thesisSupervisors.thesisId, thesisIds))
    .orderBy(asc(thesisSupervisors.thesisId), asc(thesisSupervisors.position));

  const grouped = new Map<
    string,
    { name: string; lecturerId: string | null; role: "main" | "co" | null }[]
  >();
  for (const row of rows) {
    const supervisors = grouped.get(row.thesisId) ?? [];
    supervisors.push({ name: row.name, lecturerId: row.lecturerId, role: row.role });
    grouped.set(row.thesisId, supervisors);
  }
  return grouped;
}

async function getAdminFields(db: Database, thesisIds: string[]) {
  if (thesisIds.length === 0) return new Map<string, { id: string; name: string; lab: string }[]>();
  const rows = await db
    .select({
      thesisId: thesisFieldLinks.thesisId,
      id: thesisFields.id,
      name: thesisFields.name,
      lab: thesisFields.lab,
    })
    .from(thesisFieldLinks)
    .innerJoin(thesisFields, eq(thesisFields.id, thesisFieldLinks.fieldId))
    .where(inArray(thesisFieldLinks.thesisId, thesisIds))
    .orderBy(asc(thesisFieldLinks.thesisId), asc(thesisFields.lab), asc(thesisFields.position));

  const grouped = new Map<string, { id: string; name: string; lab: string }[]>();
  for (const row of rows) {
    const fields = grouped.get(row.thesisId) ?? [];
    fields.push({ id: row.id, name: row.name, lab: row.lab });
    grouped.set(row.thesisId, fields);
  }
  return grouped;
}

async function getAdminKeywords(db: Database, thesisIds: string[]) {
  if (thesisIds.length === 0) return new Map<string, string[]>();
  const rows = await db
    .select({ thesisId: thesisKeywords.thesisId, keyword: thesisKeywords.keyword })
    .from(thesisKeywords)
    .where(inArray(thesisKeywords.thesisId, thesisIds))
    .orderBy(asc(thesisKeywords.thesisId), asc(thesisKeywords.keyword));

  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const keywords = grouped.get(row.thesisId) ?? [];
    keywords.push(row.keyword);
    grouped.set(row.thesisId, keywords);
  }
  return grouped;
}

export async function listAdminTheses(db: Database, offset: number, status: ThesisStatusFilter) {
  const where =
    status === "deleted"
      ? isNotNull(theses.deletedAt)
      : and(isNull(theses.deletedAt), eq(theses.status, status));

  const rows = await db
    .select(thesisColumns)
    .from(theses)
    .where(where)
    .orderBy(desc(theses.updatedAt), asc(theses.title))
    .limit(51)
    .offset(offset);
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [supervisors, keywords, fields] = await Promise.all([
    getAdminSupervisors(db, ids),
    getAdminKeywords(db, ids),
    getAdminFields(db, ids),
  ]);
  return rows.map((row) => ({
    ...row,
    supervisors: supervisors.get(row.id) ?? [],
    keywords: keywords.get(row.id) ?? [],
    fields: fields.get(row.id) ?? [],
  }));
}

export async function getAdminThesisCounts(db: Database) {
  const [row] = await db
    .select({
      draft: sql<number>`coalesce(sum(case when ${theses.status} = 'draft' and ${theses.deletedAt} is null then 1 else 0 end), 0)`,
      published: sql<number>`coalesce(sum(case when ${theses.status} = 'published' and ${theses.deletedAt} is null then 1 else 0 end), 0)`,
      hidden: sql<number>`coalesce(sum(case when ${theses.status} = 'hidden' and ${theses.deletedAt} is null then 1 else 0 end), 0)`,
      deleted: sql<number>`coalesce(sum(case when ${theses.deletedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(theses);
  return {
    draft: Number(row?.draft ?? 0),
    published: Number(row?.published ?? 0),
    hidden: Number(row?.hidden ?? 0),
    deleted: Number(row?.deleted ?? 0),
  };
}

export async function getAdminThesisLecturers(db: Database) {
  return db
    .select({ id: lecturers.id, name: lecturers.name })
    .from(lecturers)
    .where(isNull(lecturers.deletedAt))
    .orderBy(asc(lecturers.name));
}

export async function getAdminThesisFields(db: Database) {
  return db
    .select({ id: thesisFields.id, name: thesisFields.name, lab: thesisFields.lab })
    .from(thesisFields)
    .orderBy(asc(thesisFields.lab), asc(thesisFields.position), asc(thesisFields.name));
}

export async function getAdminThesisById(db: Database, thesisId: string) {
  const [row] = await db.select(thesisColumns).from(theses).where(eq(theses.id, thesisId));
  if (!row) return null;
  const [supervisors, keywords, fields] = await Promise.all([
    getAdminSupervisors(db, [thesisId]),
    getAdminKeywords(db, [thesisId]),
    getAdminFields(db, [thesisId]),
  ]);
  return {
    ...row,
    supervisors: supervisors.get(thesisId) ?? [],
    keywords: keywords.get(thesisId) ?? [],
    fields: fields.get(thesisId) ?? [],
  };
}

export async function thesisIdExists(db: Database, thesisId: string): Promise<boolean> {
  const [row] = await db.select({ id: theses.id }).from(theses).where(eq(theses.id, thesisId));
  return row !== undefined;
}

export function slugifyThesisId(value: string): string {
  return slugifyCatalogText(value, "thesis");
}

export async function allocateThesisId(db: Database, title: string, year: number): Promise<string> {
  return allocateCatalogId(`${title} ${year}`, "thesis", (pattern) =>
    db.select({ id: theses.id }).from(theses).where(like(theses.id, pattern)),
  );
}

function supervisorRows(thesisId: string, input: CreateThesisInput | UpdateThesisInput) {
  return input.supervisors.map((supervisor, position) => ({
    thesisId,
    position,
    lecturerId: supervisor.lecturerId,
    name: supervisor.name,
    role: supervisor.role,
  }));
}

function keywordRows(thesisId: string, keywords: string[]) {
  return [...new Set(keywords)].map((keyword) => ({ thesisId, keyword }));
}

function fieldRows(thesisId: string, fieldIds: string[]) {
  return [...new Set(fieldIds)].map((fieldId) => ({ thesisId, fieldId }));
}

function thesisValues(
  input: CreateThesisInput | UpdateThesisInput,
  consentAt: Date | null,
  consentSource: string | null,
) {
  return {
    title: input.title,
    authorName: input.authorName,
    authorBatch: input.authorBatch,
    year: input.year,
    type: input.type,
    language: input.language,
    abstract: input.abstract,
    abstractEn: input.abstractEn,
    repositoryUrl: input.repositoryUrl,
    contactChannel: input.contactChannel,
    contactValue: input.contactValue,
    abstractPublic: input.abstractPublic,
    contactPublic: input.contactPublic,
    consentAt,
    consentSource,
    status: input.status,
  };
}

export async function createThesisRecord(
  db: Database,
  id: string,
  input: CreateThesisInput,
  consentAt: Date | null,
  consentSource: string | null,
): Promise<void> {
  const supervisors = supervisorRows(id, input);
  const keywords = keywordRows(id, input.keywords);
  const fields = fieldRows(id, input.fieldIds);
  const insertThesis = db
    .insert(theses)
    .values({ id, ...thesisValues(input, consentAt, consentSource) });
  const insertSupervisors = db.insert(thesisSupervisors).values(supervisors);
  if (keywords.length > 0 && fields.length > 0) {
    await db.batch([
      insertThesis,
      insertSupervisors,
      db.insert(thesisKeywords).values(keywords),
      db.insert(thesisFieldLinks).values(fields),
    ]);
  } else if (keywords.length > 0) {
    await db.batch([insertThesis, insertSupervisors, db.insert(thesisKeywords).values(keywords)]);
  } else if (fields.length > 0) {
    await db.batch([insertThesis, insertSupervisors, db.insert(thesisFieldLinks).values(fields)]);
  } else {
    await db.batch([insertThesis, insertSupervisors]);
  }
}

export async function updateThesisRecord(
  db: Database,
  id: string,
  input: UpdateThesisInput,
  consentAt: Date | null,
  consentSource: string | null,
): Promise<void> {
  const supervisors = supervisorRows(id, input);
  const keywords = keywordRows(id, input.keywords);
  const fields = fieldRows(id, input.fieldIds);
  const update = db
    .update(theses)
    .set({ ...thesisValues(input, consentAt, consentSource), updatedAt: new Date() })
    .where(eq(theses.id, id));
  const deleteSupervisors = db.delete(thesisSupervisors).where(eq(thesisSupervisors.thesisId, id));
  const deleteKeywords = db.delete(thesisKeywords).where(eq(thesisKeywords.thesisId, id));
  const deleteFields = db.delete(thesisFieldLinks).where(eq(thesisFieldLinks.thesisId, id));
  const insertSupervisors = db.insert(thesisSupervisors).values(supervisors);
  if (keywords.length > 0 && fields.length > 0) {
    await db.batch([
      update,
      deleteSupervisors,
      deleteKeywords,
      deleteFields,
      insertSupervisors,
      db.insert(thesisKeywords).values(keywords),
      db.insert(thesisFieldLinks).values(fields),
    ]);
  } else if (keywords.length > 0) {
    await db.batch([
      update,
      deleteSupervisors,
      deleteKeywords,
      deleteFields,
      insertSupervisors,
      db.insert(thesisKeywords).values(keywords),
    ]);
  } else if (fields.length > 0) {
    await db.batch([
      update,
      deleteSupervisors,
      deleteKeywords,
      deleteFields,
      insertSupervisors,
      db.insert(thesisFieldLinks).values(fields),
    ]);
  } else {
    await db.batch([update, deleteSupervisors, deleteKeywords, deleteFields, insertSupervisors]);
  }
}

export async function setThesisLifecycle(
  db: Database,
  input: ThesisLifecycleInput,
): Promise<boolean> {
  const updatedAt = new Date();
  const deletedAt =
    input.action === "restore" ? isNotNull(theses.deletedAt) : isNull(theses.deletedAt);
  const changes = {
    publish: { status: "published" },
    hide: { status: "hidden" },
    delete: { deletedAt: updatedAt },
    restore: { deletedAt: null, status: "draft" },
  } satisfies Record<ThesisLifecycleInput["action"], Partial<typeof theses.$inferInsert>>;

  const [updated] = await db
    .update(theses)
    .set({ ...changes[input.action], updatedAt })
    .where(and(eq(theses.id, input.thesisId), deletedAt))
    .returning({ id: theses.id });
  return updated !== undefined;
}
