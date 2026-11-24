import { and, desc, eq, ne, sql, type SQL } from "drizzle-orm";
import { announcements } from "@g13/db/schema/announcements";
import type { createDatabase } from "@g13/db/client";
import type {
  AnnouncementStatus,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

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
) {
  return db
    .select()
    .from(announcements)
    .where(statusCondition(status, now))
    .orderBy(desc(announcements.startsAt), desc(announcements.id))
    .limit(51)
    .offset(offset);
}

export async function getAnnouncementCounts(db: Database, now: Date) {
  const count = (status: AnnouncementStatus) =>
    sql<number>`coalesce(sum(case when ${statusCondition(status, now)} then 1 else 0 end), 0)`;
  const [counts] = await db
    .select({
      live: count("live"),
      scheduled: count("scheduled"),
      expired: count("expired"),
      disabled: count("disabled"),
    })
    .from(announcements);
  return counts;
}

export async function isSlugTaken(db: Database, slug: string, excludeId?: string) {
  const [existing] = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(
      excludeId === undefined
        ? eq(announcements.slug, slug)
        : and(eq(announcements.slug, slug), ne(announcements.id, excludeId)),
    )
    .limit(1);
  return existing !== undefined;
}

export async function createAnnouncementRecord(
  db: Database,
  input: CreateAnnouncementInput,
  createdById: string,
) {
  const [created] = await db
    .insert(announcements)
    .values({
      id: crypto.randomUUID(),
      slug: input.slug,
      titleId: input.titleId,
      titleEn: input.titleEn,
      bodyId: input.bodyId,
      bodyEn: input.bodyEn,
      ctaHref: input.ctaHref === "" ? null : input.ctaHref,
      ctaLabelId: input.ctaLabelId === "" ? null : input.ctaLabelId,
      ctaLabelEn: input.ctaLabelEn === "" ? null : input.ctaLabelEn,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt === null ? null : new Date(input.endsAt),
      enabled: input.enabled,
      createdById,
    })
    .returning({ id: announcements.id });
  return created;
}

export async function updateAnnouncementRecord(
  db: Database,
  input: UpdateAnnouncementInput,
): Promise<boolean> {
  const [updated] = await db
    .update(announcements)
    .set({
      slug: input.slug,
      titleId: input.titleId,
      titleEn: input.titleEn,
      bodyId: input.bodyId,
      bodyEn: input.bodyEn,
      ctaHref: input.ctaHref === "" ? null : input.ctaHref,
      ctaLabelId: input.ctaLabelId === "" ? null : input.ctaLabelId,
      ctaLabelEn: input.ctaLabelEn === "" ? null : input.ctaLabelEn,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt === null ? null : new Date(input.endsAt),
      enabled: input.enabled,
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, input.announcementId))
    .returning({ id: announcements.id });
  return updated !== undefined;
}

export async function setAnnouncementEnabled(
  db: Database,
  announcementId: string,
  enabled: boolean,
): Promise<boolean> {
  const [updated] = await db
    .update(announcements)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(announcements.id, announcementId))
    .returning({ id: announcements.id });
  return updated !== undefined;
}

export async function deleteAnnouncement(db: Database, announcementId: string): Promise<boolean> {
  const [deleted] = await db
    .delete(announcements)
    .where(eq(announcements.id, announcementId))
    .returning({ id: announcements.id });
  return deleted !== undefined;
}
