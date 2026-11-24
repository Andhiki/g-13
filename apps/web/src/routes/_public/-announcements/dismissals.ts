export const DISMISSED_ANNOUNCEMENTS_KEY = "g13-dismissed-announcements";
export const DISMISSAL_RETENTION_MS = 5 * 60 * 1000;

export type DismissedAnnouncements = Record<string, number>;

function isDismissalRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads dismissals from raw storage, pruning entries that fell out of the retention window. */
export function parseDismissedAnnouncements(
  raw: string | null,
  now = Date.now(),
): DismissedAnnouncements {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDismissalRecord(parsed)) return {};
    const dismissals: DismissedAnnouncements = {};
    for (const [announcementId, dismissedAt] of Object.entries(parsed)) {
      if (
        announcementId.length === 0 ||
        typeof dismissedAt !== "number" ||
        !Number.isFinite(dismissedAt) ||
        now - dismissedAt >= DISMISSAL_RETENTION_MS
      )
        continue;
      dismissals[announcementId] = dismissedAt;
    }
    return dismissals;
  } catch {
    return {};
  }
}

export function dismissAnnouncement(
  dismissals: DismissedAnnouncements,
  announcementId: string,
  now = Date.now(),
): DismissedAnnouncements {
  return { ...dismissals, [announcementId]: now };
}

export function filterAnnouncementsNotDismissed<T extends { id: string }>(
  rows: readonly T[],
  dismissals: DismissedAnnouncements,
): T[] {
  return rows.filter((row) => !(row.id in dismissals));
}
