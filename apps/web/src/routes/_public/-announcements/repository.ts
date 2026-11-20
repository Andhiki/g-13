import { asc, and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { announcements } from "@g13/db/schema/announcements";
import type { createDatabase } from "@g13/db/client";

type Database = ReturnType<typeof createDatabase>;

export type ActiveAnnouncement = {
  id: string;
  slug: string;
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  ctaHref: string | null;
  ctaLabelId: string | null;
  ctaLabelEn: string | null;
};

export async function listActiveAnnouncements(
  db: Database,
  now: number,
): Promise<ActiveAnnouncement[]> {
  return db
    .select({
      id: announcements.id,
      slug: announcements.slug,
      titleId: announcements.titleId,
      titleEn: announcements.titleEn,
      bodyId: announcements.bodyId,
      bodyEn: announcements.bodyEn,
      ctaHref: announcements.ctaHref,
      ctaLabelId: announcements.ctaLabelId,
      ctaLabelEn: announcements.ctaLabelEn,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.enabled, true),
        lte(announcements.startsAt, new Date(now)),
        or(isNull(announcements.endsAt), gt(announcements.endsAt, new Date(now))),
      ),
    )
    .orderBy(asc(announcements.startsAt), asc(announcements.id));
}
