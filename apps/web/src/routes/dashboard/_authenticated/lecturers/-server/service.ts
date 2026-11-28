import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { lecturers } from "@g13/db/schema/lecturers";
import { LECTURER_ADMIN_ERRORS, type LecturerAdminResult } from "../-shared/errors";
import type {
  CreateLecturerInput,
  LecturerLifecycleInput,
  LecturerStatus,
  UpdateLecturerInput,
} from "../-shared/schemas";
import {
  createLecturerRecord,
  setLecturerDeletedState,
  updateLecturerRecord,
  adminLecturerSearchColumns,
  countAdminLecturers,
  selectAdminLecturerRows,
} from "./repository";
import {
  loadAdminList,
  softDeleteCondition,
  softDeleteStatuses,
  type AdminListData,
} from "../../-server/admin-list";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };
type LecturerListData = AdminListData<
  LecturerStatus,
  Awaited<ReturnType<typeof selectAdminLecturerRows>>[number]
>;

export async function inspectLecturers(
  db: Database,
  actor: Actor,
  offset = 0,
  status: LecturerStatus = "active",
  query = "",
): Promise<LecturerAdminResult<LecturerListData>> {
  const data = await loadAdminList(
    {
      canView: canModerate,
      statuses: softDeleteStatuses,
      statusCondition: softDeleteCondition(lecturers.deletedAt),
      searchColumns: adminLecturerSearchColumns,
      rows: (where, page) => selectAdminLecturerRows(db, where, page),
      count: (counts, where) => countAdminLecturers(db, counts, where),
    },
    actor,
    { offset, status, query },
  );
  return data ? { data, error: null } : { data: null, error: LECTURER_ADMIN_ERRORS.FORBIDDEN };
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
