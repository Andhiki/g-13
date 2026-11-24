import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import type { createDatabase } from "@g13/db/client";
import { lecturers } from "@g13/db/schema/lecturers";
import { theses, thesisKeywords, thesisSupervisors } from "@g13/db/schema/theses";
import type {
  ThesisCardRecord,
  ThesisDetailRecord,
  ThesisSupervisorRecord,
} from "../-shared/thesis";

type Database = ReturnType<typeof createDatabase>;

const visibleThesis = and(eq(theses.status, "published"), isNull(theses.deletedAt));

const cardColumns = {
  id: theses.id,
  title: theses.title,
  authorName: theses.authorName,
  authorBatch: theses.authorBatch,
  year: theses.year,
  type: theses.type,
  field: theses.field,
};

const detailColumns = {
  ...cardColumns,
  abstract: theses.abstract,
  abstractEn: theses.abstractEn,
  language: theses.language,
  repositoryUrl: theses.repositoryUrl,
  contactChannel: theses.contactChannel,
  contactValue: theses.contactValue,
  abstractPublic: theses.abstractPublic,
  contactPublic: theses.contactPublic,
};

async function getSupervisors(
  db: Database,
  thesisIds: string[],
): Promise<Map<string, ThesisSupervisorRecord[]>> {
  if (thesisIds.length === 0) return new Map();
  const rows = await db
    .select({
      thesisId: thesisSupervisors.thesisId,
      name: thesisSupervisors.name,
      lecturerId: thesisSupervisors.lecturerId,
      role: thesisSupervisors.role,
      lecturerName: lecturers.name,
      lecturerDeletedAt: lecturers.deletedAt,
    })
    .from(thesisSupervisors)
    .leftJoin(lecturers, eq(lecturers.id, thesisSupervisors.lecturerId))
    .where(inArray(thesisSupervisors.thesisId, thesisIds))
    .orderBy(asc(thesisSupervisors.thesisId), asc(thesisSupervisors.position));

  const grouped = new Map<string, ThesisSupervisorRecord[]>();
  for (const row of rows) {
    const supervisors = grouped.get(row.thesisId) ?? [];
    supervisors.push({
      name: row.name,
      lecturerId: row.lecturerId,
      lecturerName: row.lecturerName,
      lecturerDeletedAt: row.lecturerDeletedAt,
      role: row.role,
    });
    grouped.set(row.thesisId, supervisors);
  }
  return grouped;
}

async function getKeywords(db: Database, thesisIds: string[]): Promise<Map<string, string[]>> {
  if (thesisIds.length === 0) return new Map();
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

export async function getPublishedThesisCards(db: Database): Promise<ThesisCardRecord[]> {
  const rows = await db
    .select(cardColumns)
    .from(theses)
    .where(visibleThesis)
    .orderBy(desc(theses.year), asc(theses.title));

  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [supervisors, keywords] = await Promise.all([
    getSupervisors(db, ids),
    getKeywords(db, ids),
  ]);

  return rows.map((row) => ({
    ...row,
    supervisors: supervisors.get(row.id) ?? [],
    keywords: keywords.get(row.id) ?? [],
  }));
}

export async function getPublishedThesisBySlug(
  db: Database,
  slug: string,
): Promise<ThesisDetailRecord | null> {
  const [row] = await db
    .select(detailColumns)
    .from(theses)
    .where(and(visibleThesis, eq(theses.id, slug)));
  if (!row) return null;

  const [supervisors, keywords] = await Promise.all([
    getSupervisors(db, [row.id]),
    getKeywords(db, [row.id]),
  ]);
  return {
    ...row,
    supervisors: supervisors.get(row.id) ?? [],
    keywords: keywords.get(row.id) ?? [],
  };
}

export async function getPublishedThesisSitemap(
  db: Database,
): Promise<{ slug: string; updatedAt: Date }[]> {
  return db
    .select({ slug: theses.id, updatedAt: theses.updatedAt })
    .from(theses)
    .where(visibleThesis)
    .orderBy(desc(theses.year), asc(theses.title));
}
