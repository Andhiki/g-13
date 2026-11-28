import { and, asc, eq, isNotNull, isNull, like, sql, type SQL } from "drizzle-orm";
import { lecturers } from "@g13/db/schema/lecturers";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import type { createDatabase } from "@g13/db/client";
import { allocateCatalogId } from "@/routes/dashboard/_authenticated/-server/slug";
import type {
  CreateLecturerInput,
  LecturerLifecycleInput,
  UpdateLecturerInput,
} from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

export const adminLecturerSearchColumns = [lecturers.name, lecturers.id];

async function allocateLecturerId(db: Database, name: string): Promise<string> {
  return allocateCatalogId(name, "lecturer", (pattern) =>
    db.select({ id: lecturers.id }).from(lecturers).where(like(lecturers.id, pattern)),
  );
}

export async function selectAdminLecturerRows(
  db: Database,
  where: SQL | undefined,
  page: { limit: number; offset: number },
) {
  return db
    .select({
      id: lecturers.id,
      name: lecturers.name,
      deletedAt: lecturers.deletedAt,
      reviewCount: sql<number>`count(${reviews.id})`,
    })
    .from(lecturers)
    .leftJoin(reviews, eq(reviews.lecturerId, lecturers.id))
    .where(where)
    .groupBy(lecturers.id)
    .orderBy(asc(lecturers.name), asc(lecturers.id))
    .limit(page.limit)
    .offset(page.offset);
}

export async function countAdminLecturers(
  db: Database,
  counts: Record<string, SQL<number>>,
  where: SQL | undefined,
) {
  const [result] = await db.select(counts).from(lecturers).where(where);
  return result;
}

export async function createLecturerRecord(db: Database, input: CreateLecturerInput) {
  const id = await allocateLecturerId(db, input.name);
  const [created] = await db
    .insert(lecturers)
    .values({
      id,
      name: input.name,
    })
    .returning({
      id: lecturers.id,
      name: lecturers.name,
      deletedAt: lecturers.deletedAt,
    });
  return created;
}

export async function updateLecturerRecord(
  db: Database,
  input: UpdateLecturerInput,
): Promise<boolean> {
  const [updated] = await db
    .update(lecturers)
    .set({ name: input.name })
    .where(and(eq(lecturers.id, input.lecturerId), isNull(lecturers.deletedAt)))
    .returning({ id: lecturers.id });
  return updated !== undefined;
}

export async function setLecturerDeletedState(
  db: Database,
  input: LecturerLifecycleInput,
): Promise<boolean> {
  const [updated] = await db
    .update(lecturers)
    .set({ deletedAt: input.action === "delete" ? new Date() : null })
    .where(
      and(
        eq(lecturers.id, input.lecturerId),
        input.action === "delete" ? isNull(lecturers.deletedAt) : isNotNull(lecturers.deletedAt),
      ),
    )
    .returning({ id: lecturers.id });
  return updated !== undefined;
}
