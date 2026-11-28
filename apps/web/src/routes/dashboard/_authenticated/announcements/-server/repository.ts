import { adminSearchCondition } from "../../-server/search";
import { announcementSearchFields } from "../-shared/schemas";
import {
  and,
  desc,
  eq,
  exists,
  getTableColumns,
  inArray,
  notExists,
  notInArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { announcements } from "@g13/db/schema/announcements";
import type { createDatabase } from "@g13/db/client";
import type {
  AnnouncementStatus,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "../-shared/schemas";

import type { AnnouncementConflict } from "../-shared/errors";

type AnnouncementWrite = { id: string } | { conflicts: AnnouncementConflict[] };

type Database = ReturnType<typeof createDatabase>;

function searchCondition(query: string) {
  return adminSearchCondition(query, announcementSearchFields, {
    id: announcements.id,
    titleId: announcements.titleId,
    titleEn: announcements.titleEn,
  });
}

/** Single definition of each schedule state, shared by the list filter and the counts aggregate. */
function statusCondition(status: AnnouncementStatus, now: Date): SQL {
  const at = now.getTime();
  switch (status) {
    case "live":
      return sql`${announcements.enabled} = true and ${announcements.startsAt} <= ${at} and (${announcements.endsAt} is null or ${announcements.endsAt} > ${at})`;
    case "scheduled":
      return sql`${announcements.enabled} = true and ${announcements.startsAt} > ${at}`;
    case "expired":
      return sql`${announcements.enabled} = true and ${announcements.endsAt} is not null and ${announcements.endsAt} <= ${at}`;
    case "disabled":
      return sql`${announcements.enabled} = false`;
  }
}

export async function listAdminAnnouncements(
  db: Database,
  offset: number,
  status: AnnouncementStatus,
  now: Date,
  query = "",
) {
  return db
    .select()
    .from(announcements)
    .where(and(statusCondition(status, now), searchCondition(query)))
    .orderBy(desc(announcements.startsAt), desc(announcements.id))
    .limit(51)
    .offset(offset);
}

export async function getAnnouncementCounts(db: Database, now: Date, query = "") {
  const count = (status: AnnouncementStatus) =>
    sql<number>`coalesce(sum(case when ${statusCondition(status, now)} then 1 else 0 end), 0)`;
  const [counts] = await db
    .select({
      live: count("live"),
      scheduled: count("scheduled"),
      expired: count("expired"),
      disabled: count("disabled"),
    })
    .from(announcements)
    .where(searchCondition(query));
  return counts;
}

function announcementValues(input: CreateAnnouncementInput) {
  return {
    variant: input.variant,
    titleId: input.titleId,
    titleEn: input.titleEn,
    bodyId: input.bodyId,
    bodyEn: input.bodyEn,
    ctaHref: input.ctaHref || null,
    ctaOpenInNewTab: Boolean(input.ctaHref) && input.ctaOpenInNewTab,
    ctaLabelId: input.ctaLabelId || null,
    ctaLabelEn: input.ctaLabelEn || null,
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt === null ? null : new Date(input.endsAt),
    countdownAt: input.countdownAt === null ? null : new Date(input.countdownAt),
    enabled: input.enabled,
  };
}

// Keep the end exclusive, matching the public visibility query.
function overlaps(id: string, startsAt: number | SQL, endsAt: number | null | SQL) {
  return sql`${announcements.id} <> ${id}
    and ${announcements.enabled} = true
    and (${endsAt} is null or ${announcements.startsAt} < ${endsAt})
    and (${announcements.endsAt} is null or ${announcements.endsAt} > ${startsAt})`;
}

// Each write runs these operations in one D1 batch. Leave every conflict enabled
// if any is unconfirmed, and write the target only once its window is clear.
function conflictQueries(
  db: Database,
  condition: SQL,
  confirmedIds: string[] = [],
  targetExists: SQL = sql`true`,
) {
  // json_each binds the whole confirmed set with one D1 parameter.
  const confirmed = sql`(select value from json_each(${JSON.stringify(confirmedIds)}))`;
  const conflicts = db
    .select({
      id: announcements.id,
      titleEn: announcements.titleEn,
      startsAt: announcements.startsAt,
      endsAt: announcements.endsAt,
    })
    .from(announcements)
    .where(and(targetExists, condition))
    .orderBy(announcements.id);
  const conflictIds = db.select({ id: announcements.id }).from(announcements).where(condition);
  const unconfirmed = db
    .select({ id: announcements.id })
    .from(announcements)
    .where(and(condition, notInArray(announcements.id, confirmed)));

  const disable = db
    .update(announcements)
    .set({ enabled: false, updatedAt: new Date() })
    .where(
      and(targetExists, condition, inArray(announcements.id, confirmed), notExists(unconfirmed)),
    );

  return { disable, conflicts, clear: notExists(conflictIds) };
}

export async function createAnnouncementRecord(
  db: Database,
  input: CreateAnnouncementInput,
  createdById: string,
): Promise<AnnouncementWrite> {
  const id = crypto.randomUUID();
  const values = { ...announcementValues(input), id, createdById };
  if (!input.enabled) {
    await db.insert(announcements).values(values);
    return { id };
  }

  const { disable, conflicts, clear } = conflictQueries(
    db,
    overlaps(id, input.startsAt, input.endsAt),
    input.confirmedConflictIds,
  );
  const now = new Date();
  const row: typeof announcements.$inferSelect = { ...values, createdAt: now, updatedAt: now };
  const columns = getTableColumns(announcements);
  const parameters = (Object.keys(columns) as (keyof typeof columns)[]).map((key) =>
    sql.param(row[key], columns[key]),
  );
  const insert = db
    .insert(announcements)
    .select(sql`select ${sql.join(parameters, sql`, `)} where ${clear}`)
    .returning({ id: announcements.id });
  const [, [created], remaining] = await db.batch([disable, insert, conflicts]);
  return created ?? { conflicts: remaining };
}

export async function updateAnnouncementRecord(
  db: Database,
  input: UpdateAnnouncementInput,
): Promise<AnnouncementWrite | undefined> {
  const { announcementId: id } = input;
  const target = eq(announcements.id, id);
  const update = db
    .update(announcements)
    .set({ ...announcementValues(input), updatedAt: new Date() });
  const returning = { id: announcements.id };
  if (!input.enabled) {
    const [updated] = await update.where(target).returning(returning);
    return updated;
  }

  const { disable, conflicts, clear } = conflictQueries(
    db,
    overlaps(id, input.startsAt, input.endsAt),
    input.confirmedConflictIds,
    exists(db.select({ id: announcements.id }).from(announcements).where(target)),
  );
  const [, [updated], remaining] = await db.batch([
    disable,
    update.where(and(target, clear)).returning(returning),
    conflicts,
  ]);
  return updated ?? (remaining.length ? { conflicts: remaining } : undefined);
}

export async function setAnnouncementEnabled(
  db: Database,
  id: string,
  enabled: boolean,
  confirmedIds?: string[],
): Promise<AnnouncementWrite | undefined> {
  const target = eq(announcements.id, id);
  const update = db.update(announcements).set({ enabled, updatedAt: new Date() });
  const returning = { id: announcements.id };
  if (!enabled) {
    const [updated] = await update.where(target).returning(returning);
    return updated;
  }

  const startsAt = sql`(${db.select({ value: announcements.startsAt }).from(announcements).where(target)})`;
  const endsAt = sql`(${db.select({ value: announcements.endsAt }).from(announcements).where(target)})`;
  const { disable, conflicts, clear } = conflictQueries(
    db,
    overlaps(id, startsAt, endsAt),
    confirmedIds,
    exists(db.select({ id: announcements.id }).from(announcements).where(target)),
  );
  const [, [updated], remaining] = await db.batch([
    disable,
    update.where(and(target, clear)).returning(returning),
    conflicts,
  ]);
  return updated ?? (remaining.length ? { conflicts: remaining } : undefined);
}

export async function deleteAnnouncement(db: Database, announcementId: string): Promise<boolean> {
  const [deleted] = await db
    .delete(announcements)
    .where(eq(announcements.id, announcementId))
    .returning({ id: announcements.id });
  return deleted !== undefined;
}
