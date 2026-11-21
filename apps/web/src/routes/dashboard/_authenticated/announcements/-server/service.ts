import { slugifyCatalogText } from "@/routes/dashboard/_authenticated/-server/slug";
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
  isSlugTaken,
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

async function resolveUniqueSlug(
  db: Database,
  slug: string,
  fallbackSource: string,
  excludeId?: string,
): Promise<string | null> {
  const base = slug === "" ? slugifyCatalogText(fallbackSource, "announcement") : slug;
  if (await isSlugTaken(db, base, excludeId)) return null;
  return base;
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
  const slug = await resolveUniqueSlug(db, input.slug, input.titleId);
  if (slug === null) return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.SLUG_IN_USE };
  const created = await createAnnouncementRecord(db, { ...input, slug }, actor.id);
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
  const slug = await resolveUniqueSlug(db, input.slug, input.titleId, input.announcementId);
  if (slug === null) return { data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.SLUG_IN_USE };
  if (!(await updateAnnouncementRecord(db, { ...input, slug }))) {
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
