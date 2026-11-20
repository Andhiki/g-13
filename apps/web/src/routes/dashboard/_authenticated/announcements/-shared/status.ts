import type { AnnouncementStatus } from "./schemas";

export type AnnouncementStatusFields = {
  enabled: boolean;
  startsAt: Date;
  endsAt: Date | null;
};

/** Derives the schedule state shown in admin filters, rows, and the public banner check. */
export function resolveAnnouncementStatus(
  row: AnnouncementStatusFields,
  now = Date.now(),
): AnnouncementStatus {
  if (!row.enabled) return "disabled";
  if (row.startsAt.getTime() > now) return "scheduled";
  if (row.endsAt !== null && row.endsAt.getTime() <= now) return "expired";
  return "live";
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
