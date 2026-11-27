import { adminSearchCondition } from "../../-server/search";
import { ADMIN_PAGE_SIZE } from "../../-shared/admin-pagination";
import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { courses } from "@g13/db/schema/courses";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import type { createDatabase } from "@g13/db/client";
import type {
  CourseLifecycleInput,
  CourseStatus,
  CreateCourseInput,
  UpdateCourseInput,
} from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

function searchCondition(query: string) {
  return adminSearchCondition(query, [courses.code, courses.nameId, courses.nameEn, courses.id]);
}

export async function listAdminCourses(
  db: Database,
  offset: number,
  status: CourseStatus,
  query = "",
) {
  return db
    .select({
      id: courses.id,
      code: courses.code,
      nameId: courses.nameId,
      nameEn: courses.nameEn,
      deletedAt: courses.deletedAt,
      reviewCount: sql<number>`count(${reviews.id})`,
    })
    .from(courses)
    .leftJoin(reviews, eq(reviews.courseId, courses.id))
    .where(
      and(
        status === "active" ? isNull(courses.deletedAt) : isNotNull(courses.deletedAt),
        searchCondition(query),
      ),
    )
    .groupBy(courses.id)
    .orderBy(asc(courses.code), asc(courses.id))
    .limit(ADMIN_PAGE_SIZE)
    .offset(offset);
}

export async function getAdminCourseCounts(db: Database, query = "") {
  const [counts] = await db
    .select({
      active: sql<number>`coalesce(sum(case when ${courses.deletedAt} is null then 1 else 0 end), 0)`,
      deleted: sql<number>`coalesce(sum(case when ${courses.deletedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(courses)
    .where(searchCondition(query));
  return counts;
}

export async function courseCodeExists(db: Database, code: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, code))
    .limit(1);
  return existing !== undefined;
}

export async function createCourseRecord(db: Database, input: CreateCourseInput) {
  const [created] = await db
    .insert(courses)
    .values({
      id: input.code,
      code: input.code,
      nameId: input.nameId,
      nameEn: input.nameEn,
    })
    .returning({
      id: courses.id,
      code: courses.code,
      nameId: courses.nameId,
      nameEn: courses.nameEn,
      deletedAt: courses.deletedAt,
    });
  return created;
}

export async function updateCourseRecord(db: Database, input: UpdateCourseInput): Promise<boolean> {
  const [updated] = await db
    .update(courses)
    .set({
      nameId: input.nameId,
      nameEn: input.nameEn,
    })
    .where(and(eq(courses.id, input.courseId), isNull(courses.deletedAt)))
    .returning({ id: courses.id });
  return updated !== undefined;
}

export async function setCourseDeletedState(
  db: Database,
  input: CourseLifecycleInput,
): Promise<boolean> {
  const [updated] = await db
    .update(courses)
    .set({ deletedAt: input.action === "delete" ? new Date() : null })
    .where(
      and(
        eq(courses.id, input.courseId),
        input.action === "delete" ? isNull(courses.deletedAt) : isNotNull(courses.deletedAt),
      ),
    )
    .returning({ id: courses.id });
  return updated !== undefined;
}
