import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { LECTURER_ADMIN_ERRORS, type LecturerAdminResult } from "../-shared/errors";
import type {
  CreateLecturerInput,
  LecturerLifecycleInput,
  LecturerStatus,
  UpdateLecturerInput,
} from "../-shared/schemas";
import {
  createLecturerRecord,
  getAdminLecturerCounts,
  listAdminLecturers,
  setLecturerDeletedState,
  updateLecturerRecord,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };
type LecturerListData = {
  rows: Awaited<ReturnType<typeof listAdminLecturers>>;
  counts: Awaited<ReturnType<typeof getAdminLecturerCounts>>;
  total: number;
};

export async function inspectLecturers(
  db: Database,
  actor: Actor,
  offset = 0,
  status: LecturerStatus = "active",
  query = "",
): Promise<LecturerAdminResult<LecturerListData>> {
  if (!canModerate(actor.role)) return { data: null, error: LECTURER_ADMIN_ERRORS.FORBIDDEN };
  const [rows, counts, matchingCounts] = await Promise.all([
    listAdminLecturers(db, offset, status, query),
    getAdminLecturerCounts(db),
    query ? getAdminLecturerCounts(db, query) : undefined,
  ]);
  return { data: { rows, counts, total: (matchingCounts ?? counts)[status] }, error: null };
}

export async function createLecturer(
  db: Database,
  actor: Actor,
  input: CreateLecturerInput,
): Promise<LecturerAdminResult<{ id: string }>> {
  if (!canModerate(actor.role)) return { data: null, error: LECTURER_ADMIN_ERRORS.FORBIDDEN };
  const created = await createLecturerRecord(db, input);
  return { data: { id: created.id }, error: null };
}

export async function updateLecturer(
  db: Database,
  actor: Actor,
  input: UpdateLecturerInput,
): Promise<LecturerAdminResult<{ lecturerId: string }>> {
  if (!canModerate(actor.role)) return { data: null, error: LECTURER_ADMIN_ERRORS.FORBIDDEN };
  if (!(await updateLecturerRecord(db, input))) {
    return { data: null, error: LECTURER_ADMIN_ERRORS.LECTURER_ACTION_UNAVAILABLE };
  }
  return { data: { lecturerId: input.lecturerId }, error: null };
}

export async function changeLecturerLifecycle(
  db: Database,
  actor: Actor,
  input: LecturerLifecycleInput,
): Promise<LecturerAdminResult<LecturerLifecycleInput>> {
  if (!canModerate(actor.role)) return { data: null, error: LECTURER_ADMIN_ERRORS.FORBIDDEN };
  if (!(await setLecturerDeletedState(db, input))) {
    return { data: null, error: LECTURER_ADMIN_ERRORS.LECTURER_ACTION_UNAVAILABLE };
  }
  return { data: input, error: null };
}
