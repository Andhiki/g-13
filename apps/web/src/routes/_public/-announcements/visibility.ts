import { isAnnouncementWindowActive } from "@/routes/-announcements/schedule";
import { filterAnnouncementsNotDismissed, type DismissedAnnouncements } from "./dismissals";

type ScheduledRow = { id: string; startsAt: Date; endsAt: Date | null };

/** Rows the banner shows at `now`: inside their window and not dismissed. */
export function visibleAnnouncements<T extends ScheduledRow>(
  rows: readonly T[],
  dismissals: DismissedAnnouncements,
  now: number,
): T[] {
  return filterAnnouncementsNotDismissed(rows, dismissals).filter((row) =>
    isAnnouncementWindowActive(row.startsAt.getTime(), row.endsAt?.getTime() ?? null, now),
  );
}

/** The next time after `now` at which a row's window opens or closes, if any. */
export function nextVisibilityChange(rows: readonly ScheduledRow[], now: number): number | null {
  let next: number | null = null;
  for (const row of rows) {
    for (const at of [row.startsAt.getTime(), row.endsAt?.getTime()]) {
      if (at !== undefined && at > now && (next === null || at < next)) next = at;
    }
  }
  return next;
}
