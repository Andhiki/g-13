import { sql, type SQL } from "drizzle-orm";
import { announcements } from "@g13/db/schema/announcements";

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

export function announcementScheduledAtCondition(at: number): SQL {
  return sql`${announcements.startsAt} > ${at}`;
}

export function announcementExpiredAtCondition(at: number): SQL {
  return sql`${announcements.endsAt} is not null and ${announcements.endsAt} <= ${at}`;
}

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
