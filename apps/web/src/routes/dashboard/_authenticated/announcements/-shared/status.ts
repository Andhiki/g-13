import type { AnnouncementStatus } from "./schemas";
import { isAnnouncementWindowActive } from "@/routes/-announcements/schedule";

export type AnnouncementStatusFields = {
  enabled: boolean;
  startsAt: Date;
  endsAt: Date | null;
};

/** Derives the schedule state shown in admin filters, rows, and the inspector. */
export function resolveAnnouncementStatus(
  row: AnnouncementStatusFields,
  now = Date.now(),
): AnnouncementStatus {
  if (!row.enabled) return "disabled";
  const startsAt = row.startsAt.getTime();
  const endsAt = row.endsAt?.getTime() ?? null;
  if (isAnnouncementWindowActive(startsAt, endsAt, now)) return "live";
  return startsAt > now ? "scheduled" : "expired";
}

export function announcementStatusLabel(status: AnnouncementStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "scheduled":
      return "Scheduled";
    case "expired":
      return "Expired";
    case "disabled":
      return "Disabled";
  }
}
