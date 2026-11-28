import { adminSearchColumns } from "../../-server/search";
import { courseSearchFields } from "../-shared/schemas";
import { and, asc, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import { courses } from "@g13/db/schema/courses";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import type { createDatabase } from "@g13/db/client";
import type {
  CourseLifecycleInput,
  CreateCourseInput,
  UpdateCourseInput,
} from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

export const adminCourseSearchColumns = adminSearchColumns(courseSearchFields, {
  code: courses.code,
  nameId: courses.nameId,
  nameEn: courses.nameEn,
  id: courses.id,
});

export async function selectAdminCourseRows(
  db: Database,
  where: SQL | undefined,
  page: { limit: number; offset: number },
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
    .where(where)
    .groupBy(courses.id)
    .orderBy(asc(courses.code), asc(courses.id))
    .limit(page.limit)
    .offset(page.offset);
}

export async function countAdminCourses(
  db: Database,
  counts: Record<string, SQL<number>>,
  where: SQL | undefined,
) {
  const [result] = await db.select(counts).from(courses).where(where);
  return result;
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
