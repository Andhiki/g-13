import { ADMIN_PAGE_SIZE } from "@/routes/dashboard/_authenticated/-shared/admin-pagination";
import { adminSearchCondition } from "../../-server/search";
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
import type { BatchItem } from "drizzle-orm/batch";
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from "../-shared/schemas";
import {
  announcementStatusCondition,
  enabledAnnouncementOverlapCondition,
  type AnnouncementStatus,
} from "@/routes/-announcements/schedule";

import type { AnnouncementConflict } from "../-shared/errors";

export type AnnouncementWrite = { id: string } | { conflicts: AnnouncementConflict[] };

type Database = ReturnType<typeof createDatabase>;

function searchCondition(query: string) {
  return adminSearchCondition(query, [
    announcements.id,
    announcements.titleId,
    announcements.titleEn,
  ]);
}

function statusCondition(status: AnnouncementStatus, now: Date): SQL {
  return announcementStatusCondition(status, now.getTime());
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
    .limit(ADMIN_PAGE_SIZE)
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

// Enabling an announcement must leave its window clear of other enabled ones.
// Each write runs in one D1 batch: disable the confirmed conflicts (all or
// none: if any conflict is unconfirmed, every conflict stays enabled), write
// the target only once its window is clear, then report what still conflicts.
async function writeClearOfConflicts(
  db: Database,
  window: {
    id: string;
    startsAt: number | SQL;
    endsAt: number | null | SQL;
    confirmedIds?: string[];
    /** For an existing target: only act while it still exists. */
    target?: SQL;
  },
  write: (clear: SQL) => BatchItem<"sqlite">,
): Promise<AnnouncementWrite | undefined> {
  const condition = enabledAnnouncementOverlapCondition(window.id, window.startsAt, window.endsAt);
  const targetExists = window.target
    ? exists(db.select({ id: announcements.id }).from(announcements).where(window.target))
    : sql`true`;
  // json_each binds the whole confirmed set with one D1 parameter.
  const confirmed = sql`(select value from json_each(${JSON.stringify(window.confirmedIds ?? [])}))`;
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

  const [, written, remaining] = (await db.batch([
    disable,
    write(notExists(conflictIds)),
    conflicts,
  ])) as [unknown, { id: string }[], AnnouncementConflict[]];
  return written[0] ?? (remaining.length ? { conflicts: remaining } : undefined);
}

export async function createAnnouncementRecord(
  db: Database,
  input: CreateAnnouncementInput,
  createdById: string,
): Promise<AnnouncementWrite | undefined> {
  const id = crypto.randomUUID();
  const values = { ...announcementValues(input), id, createdById };
  if (!input.enabled) {
    await db.insert(announcements).values(values);
    return { id };
  }

  const now = new Date();
  const row: typeof announcements.$inferSelect = { ...values, createdAt: now, updatedAt: now };
  const columns = getTableColumns(announcements);
  const parameters = (Object.keys(columns) as (keyof typeof columns)[]).map((key) =>
    sql.param(row[key], columns[key]),
  );
  return writeClearOfConflicts(
    db,
    {
      id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      confirmedIds: input.confirmedConflictIds,
    },
    (clear) =>
      db
        .insert(announcements)
        .select(sql`select ${sql.join(parameters, sql`, `)} where ${clear}`)
        .returning({ id: announcements.id }),
  );
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
  return writeClearOfConflicts(
    db,
    {
      id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      confirmedIds: input.confirmedConflictIds,
      target,
    },
    (clear) => update.where(and(target, clear)).returning(returning),
  );
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
  const column = (value: typeof announcements.startsAt | typeof announcements.endsAt) =>
    sql`(${db.select({ value }).from(announcements).where(target)})`;
  return writeClearOfConflicts(
    db,
    {
      id,
      startsAt: column(announcements.startsAt),
      endsAt: column(announcements.endsAt),
      confirmedIds,
      target,
    },
    (clear) => update.where(and(target, clear)).returning(returning),
  );
}

export async function deleteAnnouncement(db: Database, announcementId: string): Promise<boolean> {
  const [deleted] = await db
    .delete(announcements)
    .where(eq(announcements.id, announcementId))
    .returning({ id: announcements.id });
  return deleted !== undefined;
}
