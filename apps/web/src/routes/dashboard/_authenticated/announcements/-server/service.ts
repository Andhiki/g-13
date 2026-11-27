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
import { hasValidScheduleWindow } from "../-shared/schemas";
import {
  createAnnouncementRecord,
  deleteAnnouncement,
  getAnnouncementCounts,
  listAdminAnnouncements,
  setAnnouncementEnabled,
  updateAnnouncementRecord,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };

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
): Promise<AnnouncementAdminResult<AnnouncementListData>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  const now = new Date();
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
  const created = await createAnnouncementRecord(db, input, actor.id);
  if ("conflicts" in created)
    return { data: null, error: "SCHEDULE_CONFLICT", conflicts: created.conflicts };
  return { data: created, error: null };
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
  const updated = await updateAnnouncementRecord(db, input);
  if (!updated) {
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE };
  }
  if ("conflicts" in updated)
    return { data: null, error: "SCHEDULE_CONFLICT", conflicts: updated.conflicts };
  return { data: { announcementId: input.announcementId }, error: null };
}

export async function changeAnnouncementLifecycle(
  db: Database,
  actor: Actor,
  input: AnnouncementLifecycleInput,
): Promise<AnnouncementWriteResult<AnnouncementLifecycleInput>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  const updated =
    input.action === "delete"
      ? await deleteAnnouncement(db, input.announcementId)
      : await setAnnouncementEnabled(
          db,
          input.announcementId,
          input.action === "enable",
          input.confirmedConflictIds,
        );
  if (!updated) return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE };
  if (typeof updated === "object" && "conflicts" in updated) {
    return { data: null, error: "SCHEDULE_CONFLICT", conflicts: updated.conflicts };
  }
  return { data: { announcementId: input.announcementId, action: input.action }, error: null };
}
