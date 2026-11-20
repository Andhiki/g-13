import { and, asc, eq, isNotNull, isNull, like, sql } from "drizzle-orm";
import { lecturers } from "@g13/db/schema/lecturers";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import type { createDatabase } from "@g13/db/client";
import type {
  CreateLecturerInput,
  LecturerLifecycleInput,
  LecturerStatus,
  UpdateLecturerInput,
} from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

function slugifyLecturerName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `lecturer-${crypto.randomUUID().slice(0, 8)}`;
}

async function allocateLecturerId(db: Database, name: string): Promise<string> {
  const base = slugifyLecturerName(name);
  const existing = await db
    .select({ id: lecturers.id })
    .from(lecturers)
    .where(like(lecturers.id, `${base}%`));
  const used = new Set(existing.map((row) => row.id));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 10_000; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function listAdminLecturers(db: Database, offset: number, status: LecturerStatus) {
  return db
    .select({
      id: lecturers.id,
      name: lecturers.name,
      deletedAt: lecturers.deletedAt,
      reviewCount: sql<number>`count(${reviews.id})`,
    })
    .from(lecturers)
    .leftJoin(reviews, eq(reviews.lecturerId, lecturers.id))
    .where(status === "active" ? isNull(lecturers.deletedAt) : isNotNull(lecturers.deletedAt))
    .groupBy(lecturers.id)
    .orderBy(asc(lecturers.name), asc(lecturers.id))
    .limit(51)
    .offset(offset);
}

export async function getAdminLecturerCounts(db: Database) {
  const [counts] = await db
    .select({
      active: sql<number>`coalesce(sum(case when ${lecturers.deletedAt} is null then 1 else 0 end), 0)`,
      deleted: sql<number>`coalesce(sum(case when ${lecturers.deletedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(lecturers);
  return counts;
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
