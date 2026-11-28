import { asc, and, eq } from "drizzle-orm";
import { announcements, type AnnouncementVariant } from "@g13/db/schema/announcements";
import type { createDatabase } from "@g13/db/client";
import { announcementActiveAtCondition } from "@/routes/-announcements/schedule";

type Database = ReturnType<typeof createDatabase>;

export type ActiveAnnouncement = {
  id: string;
  variant: AnnouncementVariant;
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  ctaHref: string | null;
  ctaOpenInNewTab: boolean;
  ctaLabelId: string | null;
  ctaLabelEn: string | null;
  countdownAt: Date | null;
};

export async function listActiveAnnouncements(
  db: Database,
  now: number,
): Promise<ActiveAnnouncement[]> {
  return db
    .select({
      id: announcements.id,
      variant: announcements.variant,
      titleId: announcements.titleId,
      titleEn: announcements.titleEn,
      bodyId: announcements.bodyId,
      bodyEn: announcements.bodyEn,
      ctaHref: announcements.ctaHref,
      ctaOpenInNewTab: announcements.ctaOpenInNewTab,
      ctaLabelId: announcements.ctaLabelId,
      ctaLabelEn: announcements.ctaLabelEn,
      countdownAt: announcements.countdownAt,
    })
    .from(announcements)
    .where(and(eq(announcements.enabled, true), announcementActiveAtCondition(now)))
    .orderBy(asc(announcements.startsAt), asc(announcements.id));
}
