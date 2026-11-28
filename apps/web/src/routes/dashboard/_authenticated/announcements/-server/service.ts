import { canManageUsers } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import {
  ANNOUNCEMENT_ADMIN_ERRORS,
  type AnnouncementAdminResult,
  type AnnouncementWriteResult,
} from "../-shared/errors";
import type {
  AnnouncementLifecycleInput,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "../-shared/schemas";
import { hasValidScheduleWindow } from "@/routes/-announcements/schedule";
import {
  createAnnouncementRecord,
  deleteAnnouncement,
  getAnnouncementCounts,
  listAdminAnnouncements,
  setAnnouncementEnabled,
  updateAnnouncementRecord,
  type AnnouncementWrite,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };

/** Maps a schedule-checked write to its result: missing, conflicting, or done. */
function writeResult<T>(
  write: AnnouncementWrite | undefined,
  data: (written: { id: string }) => T,
): AnnouncementWriteResult<T> {
  if (!write) return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE };
  if ("conflicts" in write) {
    return { data: null, error: "SCHEDULE_CONFLICT", conflicts: write.conflicts };
  }
  return { data: data(write), error: null };
}

export type AnnouncementListData = {
  rows: Awaited<ReturnType<typeof listAdminAnnouncements>>;
  counts: Awaited<ReturnType<typeof getAnnouncementCounts>>;
  total: number;
};

export async function inspectAnnouncements(
  db: Database,
  actor: Actor,
  offset = 0,
  status: "live" | "scheduled" | "expired" | "disabled" = "live",
  query = "",
  now = new Date(),
): Promise<AnnouncementAdminResult<AnnouncementListData>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  const [rows, counts, matchingCounts] = await Promise.all([
    listAdminAnnouncements(db, offset, status, now, query),
    getAnnouncementCounts(db, now),
    query ? getAnnouncementCounts(db, now, query) : undefined,
  ]);
  return { data: { rows, counts, total: (matchingCounts ?? counts)[status] }, error: null };
}

export async function createAnnouncement(
  db: Database,
  actor: Actor,
  input: CreateAnnouncementInput,
): Promise<AnnouncementWriteResult<{ id: string }>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  if (!hasValidScheduleWindow(input)) {
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE };
  }
  return writeResult(await createAnnouncementRecord(db, input, actor.id), ({ id }) => ({ id }));
}

export async function updateAnnouncement(
  db: Database,
  actor: Actor,
  input: UpdateAnnouncementInput,
): Promise<AnnouncementWriteResult<{ announcementId: string }>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  if (!hasValidScheduleWindow(input)) {
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE };
  }
  return writeResult(await updateAnnouncementRecord(db, input), () => ({
    announcementId: input.announcementId,
  }));
}

export async function changeAnnouncementLifecycle(
  db: Database,
  actor: Actor,
  input: AnnouncementLifecycleInput,
): Promise<AnnouncementWriteResult<AnnouncementLifecycleInput>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  const data = () => ({ announcementId: input.announcementId, action: input.action });
  if (input.action === "delete") {
    return writeResult(
      (await deleteAnnouncement(db, input.announcementId))
        ? { id: input.announcementId }
        : undefined,
      data,
    );
  }
  return writeResult(
    await setAnnouncementEnabled(
      db,
      input.announcementId,
      input.action === "enable",
      input.confirmedConflictIds,
    ),
    data,
  );
}
