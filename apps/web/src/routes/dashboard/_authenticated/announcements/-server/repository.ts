import { and, desc, eq, gt, isNotNull, isNull, lte, ne, or, sql } from "drizzle-orm";
import { announcements } from "@g13/db/schema/announcements";
import type { createDatabase } from "@g13/db/client";
import type {
  AnnouncementStatus,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

function statusCondition(status: AnnouncementStatus, now: Date) {
  switch (status) {
    case "live":
      return and(
        eq(announcements.enabled, true),
        lte(announcements.startsAt, now),
        or(isNull(announcements.endsAt), gt(announcements.endsAt, now)),
      );
    case "scheduled":
      return and(eq(announcements.enabled, true), gt(announcements.startsAt, now));
    case "expired":
      return and(
        eq(announcements.enabled, true),
        isNotNull(announcements.endsAt),
        lte(announcements.endsAt, now),
      );
    case "disabled":
      return eq(announcements.enabled, false);
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
  const [counts] = await db
    .select({
      live: sql<number>`coalesce(sum(case when ${announcements.enabled} = true and ${announcements.startsAt} <= ${now.getTime()} and (${announcements.endsAt} is null or ${announcements.endsAt} > ${now.getTime()}) then 1 else 0 end), 0)`,
      scheduled: sql<number>`coalesce(sum(case when ${announcements.enabled} = true and ${announcements.startsAt} > ${now.getTime()} then 1 else 0 end), 0)`,
      expired: sql<number>`coalesce(sum(case when ${announcements.enabled} = true and ${announcements.endsAt} is not null and ${announcements.endsAt} <= ${now.getTime()} then 1 else 0 end), 0)`,
      disabled: sql<number>`coalesce(sum(case when ${announcements.enabled} = false then 1 else 0 end), 0)`,
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
