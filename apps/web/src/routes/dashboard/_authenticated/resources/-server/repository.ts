import { and, asc, eq, isNotNull, isNull, like, sql } from "drizzle-orm";
import { learningResources } from "@g13/db/schema/learning-resources";
import type { createDatabase } from "@g13/db/client";
import { allocateCatalogId } from "@/routes/dashboard/_authenticated/-server/slug";
import type {
  CreateResourceInput,
  ResourceLifecycleInput,
  ResourceStatus,
  UpdateResourceInput,
} from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

async function allocateResourceId(db: Database, title: string): Promise<string> {
  return allocateCatalogId(title, "resource", (pattern) =>
    db
      .select({ id: learningResources.id })
      .from(learningResources)
      .where(like(learningResources.id, pattern)),
  );
}

export async function listAdminResources(db: Database, offset: number, status: ResourceStatus) {
  return db
    .select({
      id: learningResources.id,
      titleId: learningResources.titleId,
      titleEn: learningResources.titleEn,
      descriptionId: learningResources.descriptionId,
      descriptionEn: learningResources.descriptionEn,
      url: learningResources.url,
      sortOrder: learningResources.sortOrder,
      updatedAt: learningResources.updatedAt,
      deletedAt: learningResources.deletedAt,
    })
    .from(learningResources)
    .where(
      status === "active"
        ? isNull(learningResources.deletedAt)
        : isNotNull(learningResources.deletedAt),
    )
    .orderBy(
      asc(learningResources.sortOrder),
      asc(learningResources.titleId),
      asc(learningResources.id),
    )
    .limit(51)
    .offset(offset);
}

export async function getAdminResourceCounts(db: Database) {
  const [counts] = await db
    .select({
      active: sql<number>`coalesce(sum(case when ${learningResources.deletedAt} is null then 1 else 0 end), 0)`,
      deleted: sql<number>`coalesce(sum(case when ${learningResources.deletedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(learningResources);
  return counts;
}

/** New resources append after every existing row, including soft-deleted ones. */
export async function getNextResourceSortOrder(db: Database): Promise<number> {
  const [row] = await db
    .select({ next: sql<number>`coalesce(max(${learningResources.sortOrder}), -1) + 1` })
    .from(learningResources);
  return Math.min(Number(row?.next ?? 0), 9999);
}

export async function createResourceRecord(db: Database, input: CreateResourceInput) {
  const id = await allocateResourceId(db, input.titleEn);
  const [created] = await db
    .insert(learningResources)
    .values({
      id,
      titleId: input.titleId,
      titleEn: input.titleEn,
      descriptionId: input.descriptionId,
      descriptionEn: input.descriptionEn,
      url: input.url,
      sortOrder: input.sortOrder,
    })
    .returning({ id: learningResources.id });
  return created;
}

export async function updateResourceRecord(
  db: Database,
  input: UpdateResourceInput,
): Promise<boolean> {
  const [updated] = await db
    .update(learningResources)
    .set({
      titleId: input.titleId,
      titleEn: input.titleEn,
      descriptionId: input.descriptionId,
      descriptionEn: input.descriptionEn,
      url: input.url,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    })
    .where(and(eq(learningResources.id, input.resourceId), isNull(learningResources.deletedAt)))
    .returning({ id: learningResources.id });
  return updated !== undefined;
}

export async function setResourceDeletedState(
  db: Database,
  input: ResourceLifecycleInput,
): Promise<boolean> {
  const [updated] = await db
    .update(learningResources)
    .set({
      deletedAt: input.action === "delete" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(learningResources.id, input.resourceId),
        input.action === "delete"
          ? isNull(learningResources.deletedAt)
          : isNotNull(learningResources.deletedAt),
      ),
    )
    .returning({ id: learningResources.id });
  return updated !== undefined;
}
