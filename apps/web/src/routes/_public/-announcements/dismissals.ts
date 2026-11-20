export const DISMISSED_ANNOUNCEMENTS_KEY = "g13-dismissed-announcements";
export const DISMISSAL_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

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
    for (const [slug, dismissedAt] of Object.entries(parsed)) {
      if (
        slug.length === 0 ||
        typeof dismissedAt !== "number" ||
        !Number.isFinite(dismissedAt) ||
        now - dismissedAt >= DISMISSAL_RETENTION_MS
      )
        continue;
      dismissals[slug] = dismissedAt;
    }
    return dismissals;
  } catch {
    return {};
  }
}

export function dismissAnnouncement(
  dismissals: DismissedAnnouncements,
  slug: string,
  now = Date.now(),
): DismissedAnnouncements {
  return { ...dismissals, [slug]: now };
}

export function filterAnnouncementsNotDismissed<T extends { slug: string }>(
  rows: readonly T[],
  dismissals: DismissedAnnouncements,
): T[] {
  return rows.filter((row) => !(row.slug in dismissals));
}
