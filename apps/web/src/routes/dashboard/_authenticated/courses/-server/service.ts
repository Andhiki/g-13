import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
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
  getAdminCourseCounts,
  listAdminCourses,
  setCourseDeletedState,
  updateCourseRecord,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };
type CourseListData = {
  rows: Awaited<ReturnType<typeof listAdminCourses>>;
  counts: Awaited<ReturnType<typeof getAdminCourseCounts>>;
  total: number;
};

export async function inspectCourses(
  db: Database,
  actor: Actor,
  offset = 0,
  status: CourseStatus = "active",
  query = "",
): Promise<CourseAdminResult<CourseListData>> {
  if (!canModerate(actor.role)) return { data: null, error: COURSE_ADMIN_ERRORS.FORBIDDEN };
  const [rows, counts, matchingCounts] = await Promise.all([
    listAdminCourses(db, offset, status, query),
    getAdminCourseCounts(db),
    query ? getAdminCourseCounts(db, query) : undefined,
  ]);
  return { data: { rows, counts, total: (matchingCounts ?? counts)[status] }, error: null };
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
