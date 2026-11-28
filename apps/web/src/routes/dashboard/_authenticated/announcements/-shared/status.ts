import type { AnnouncementStatus } from "@/routes/-announcements/schedule";

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
