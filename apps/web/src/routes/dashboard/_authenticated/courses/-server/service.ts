import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { courses } from "@g13/db/schema/courses";
import { COURSE_ADMIN_ERRORS, type CourseAdminResult } from "../-shared/errors";
import type {
  CourseLifecycleInput,
  CourseStatus,
  CreateCourseInput,
  UpdateCourseInput,
} from "../-shared/schemas";
import {
  courseCodeExists,
  createCourseRecord,
  setCourseDeletedState,
  updateCourseRecord,
  adminCourseSearchColumns,
  countAdminCourses,
  selectAdminCourseRows,
} from "./repository";
import {
  loadAdminList,
  softDeleteCondition,
  softDeleteStatuses,
  type AdminListData,
} from "../../-server/admin-list";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };
type CourseListData = AdminListData<
  CourseStatus,
  Awaited<ReturnType<typeof selectAdminCourseRows>>[number]
>;

export async function inspectCourses(
  db: Database,
  actor: Actor,
  offset = 0,
  status: CourseStatus = "active",
  query = "",
): Promise<CourseAdminResult<CourseListData>> {
  const data = await loadAdminList(
    {
      canView: canModerate,
      statuses: softDeleteStatuses,
      statusCondition: softDeleteCondition(courses.deletedAt),
      searchColumns: adminCourseSearchColumns,
      rows: (where, page) => selectAdminCourseRows(db, where, page),
      count: (counts, where) => countAdminCourses(db, counts, where),
    },
    actor,
    { offset, status, query },
  );
  return data ? { data, error: null } : { data: null, error: COURSE_ADMIN_ERRORS.FORBIDDEN };
}

export async function createCourse(
  db: Database,
  actor: Actor,
  input: CreateCourseInput,
): Promise<CourseAdminResult<{ id: string }>> {
  if (!canModerate(actor.role)) return { data: null, error: COURSE_ADMIN_ERRORS.FORBIDDEN };
  if (await courseCodeExists(db, input.code)) {
    return { data: null, error: COURSE_ADMIN_ERRORS.COURSE_CODE_TAKEN };
  }
  const created = await createCourseRecord(db, input);
  return { data: { id: created.id }, error: null };
}

export async function updateCourse(
  db: Database,
  actor: Actor,
  input: UpdateCourseInput,
): Promise<CourseAdminResult<{ courseId: string }>> {
  if (!canModerate(actor.role)) return { data: null, error: COURSE_ADMIN_ERRORS.FORBIDDEN };
  if (!(await updateCourseRecord(db, input))) {
    return { data: null, error: COURSE_ADMIN_ERRORS.COURSE_ACTION_UNAVAILABLE };
  }
  return { data: { courseId: input.courseId }, error: null };
}

export async function changeCourseLifecycle(
  db: Database,
  actor: Actor,
  input: CourseLifecycleInput,
): Promise<CourseAdminResult<CourseLifecycleInput>> {
  if (!canModerate(actor.role)) return { data: null, error: COURSE_ADMIN_ERRORS.FORBIDDEN };
  if (!(await setCourseDeletedState(db, input))) {
    return { data: null, error: COURSE_ADMIN_ERRORS.COURSE_ACTION_UNAVAILABLE };
  }
  return { data: input, error: null };
}
