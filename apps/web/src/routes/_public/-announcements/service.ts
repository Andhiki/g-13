import type { createDatabase } from "@g13/db/client";
import { listActiveAnnouncements, type ActiveAnnouncement } from "./repository";

type Database = ReturnType<typeof createDatabase>;

/** Announcements that are enabled and inside their schedule right now. */
export async function getActiveAnnouncements(
  db: Database,
  now = Date.now(),
): Promise<ActiveAnnouncement[]> {
  return listActiveAnnouncements(db, now);
}
