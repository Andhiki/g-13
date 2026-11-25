import { canManageUsers } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { ANNOUNCEMENT_ADMIN_ERRORS, type AnnouncementAdminResult } from "../-shared/errors";
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
};

export async function inspectAnnouncements(
  db: Database,
  actor: Actor,
  offset = 0,
  status: "live" | "scheduled" | "expired" | "disabled" = "live",
): Promise<AnnouncementAdminResult<AnnouncementListData>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  const now = new Date();
  const [rows, counts] = await Promise.all([
    listAdminAnnouncements(db, offset, status, now),
    getAnnouncementCounts(db, now),
  ]);
  return { data: { rows, counts }, error: null };
}

export async function createAnnouncement(
  db: Database,
  actor: Actor,
  input: CreateAnnouncementInput,
): Promise<AnnouncementAdminResult<{ id: string }>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  if (!hasValidScheduleWindow(input)) {
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE };
  }
  const created = await createAnnouncementRecord(db, input, actor.id);
  return { data: created, error: null };
}

export async function updateAnnouncement(
  db: Database,
  actor: Actor,
  input: UpdateAnnouncementInput,
): Promise<AnnouncementAdminResult<{ announcementId: string }>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  if (!hasValidScheduleWindow(input)) {
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE };
  }
  if (!(await updateAnnouncementRecord(db, input))) {
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE };
  }
  return { data: { announcementId: input.announcementId }, error: null };
}

export async function changeAnnouncementLifecycle(
  db: Database,
  actor: Actor,
  input: AnnouncementLifecycleInput,
): Promise<AnnouncementAdminResult<AnnouncementLifecycleInput>> {
  if (!canManageUsers(actor.role))
    return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN };
  const updated =
    input.action === "delete"
      ? await deleteAnnouncement(db, input.announcementId)
      : await setAnnouncementEnabled(db, input.announcementId, input.action === "enable");
  if (!updated) return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE };
  return { data: input, error: null };
}
