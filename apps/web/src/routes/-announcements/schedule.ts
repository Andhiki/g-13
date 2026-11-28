import { sql, type SQL } from "drizzle-orm";
import { announcements } from "@g13/db/schema/announcements";

// The announcement schedule rules, each in the TypeScript form (for rows the
// client already holds) and the SQL form (for queries), side by side.
// schedule.test.ts checks every pair agrees at the boundaries.

export const announcementStatuses = ["live", "scheduled", "expired", "disabled"] as const;
export type AnnouncementStatus = (typeof announcementStatuses)[number];

type ScheduleWindow = { startsAt: number; endsAt: number | null };

/** A window ends after it starts; an open end never expires. */
export function hasValidScheduleWindow({ startsAt, endsAt }: ScheduleWindow): boolean {
  return endsAt === null || endsAt > startsAt;
}

/** Announcement windows include their start and exclude their end. */
export function isAnnouncementWindowActive(
  startsAt: number,
  endsAt: number | null,
  at: number,
): boolean {
  return startsAt <= at && (endsAt === null || at < endsAt);
}

export function announcementActiveAtCondition(at: number): SQL {
  return sql`${announcements.startsAt} <= ${at} and (${announcements.endsAt} is null or ${announcements.endsAt} > ${at})`;
}

/** The schedule state shown in admin filters, rows, and the inspector. */
export function resolveAnnouncementStatus(
  row: { enabled: boolean; startsAt: Date; endsAt: Date | null },
  at = Date.now(),
): AnnouncementStatus {
  if (!row.enabled) return "disabled";
  const startsAt = row.startsAt.getTime();
  const endsAt = row.endsAt?.getTime() ?? null;
  if (isAnnouncementWindowActive(startsAt, endsAt, at)) return "live";
  return startsAt > at ? "scheduled" : "expired";
}

export function announcementStatusCondition(status: AnnouncementStatus, at: number): SQL {
  switch (status) {
    case "live":
      return sql`${announcements.enabled} = true and ${announcementActiveAtCondition(at)}`;
    case "scheduled":
      return sql`${announcements.enabled} = true and ${announcements.startsAt} > ${at}`;
    case "expired":
      return sql`${announcements.enabled} = true and ${announcements.endsAt} is not null and ${announcements.endsAt} <= ${at}`;
    case "disabled":
      return sql`${announcements.enabled} = false`;
  }
}

/** Other enabled announcements whose windows overlap this one. Only one may be live at a time. */
export function enabledAnnouncementOverlapCondition(
  id: string,
  startsAt: number | SQL,
  endsAt: number | null | SQL,
): SQL {
  return sql`${announcements.id} <> ${id}
    and ${announcements.enabled} = true
    and (${endsAt} is null or ${announcements.startsAt} < ${endsAt})
    and (${announcements.endsAt} is null or ${announcements.endsAt} > ${startsAt})`;
}
