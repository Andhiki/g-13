import { adminSearchCondition } from "../../-server/search";
import { ADMIN_PAGE_SIZE } from "@/routes/dashboard/_authenticated/-shared/admin-pagination";
import { and, asc, eq, inArray, isNotNull, isNull, like, sql } from "drizzle-orm";
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

function searchCondition(query: string) {
  return adminSearchCondition(query, [
    learningResources.titleId,
    learningResources.titleEn,
    learningResources.descriptionId,
    learningResources.descriptionEn,
    learningResources.url,
  ]);
}

async function allocateResourceId(db: Database, title: string): Promise<string> {
  return allocateCatalogId(title, "resource", (pattern) =>
    db
      .select({ id: learningResources.id })
      .from(learningResources)
      .where(like(learningResources.id, pattern)),
  );
}

export async function listAdminResources(
  db: Database,
  offset: number,
  status: ResourceStatus,
  query = "",
) {
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
      and(
        status === "active"
          ? isNull(learningResources.deletedAt)
          : isNotNull(learningResources.deletedAt),
        searchCondition(query),
      ),
    )
    .orderBy(
      asc(learningResources.sortOrder),
      asc(learningResources.titleId),
      asc(learningResources.id),
    )
    .limit(ADMIN_PAGE_SIZE)
    .offset(offset);
}

export async function getAdminResourceCounts(db: Database, query = "") {
  const [counts] = await db
    .select({
      active: sql<number>`coalesce(sum(case when ${learningResources.deletedAt} is null then 1 else 0 end), 0)`,
      deleted: sql<number>`coalesce(sum(case when ${learningResources.deletedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(learningResources)
    .where(searchCondition(query));
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
  const sortOrder = await getNextResourceSortOrder(db);
  const [created] = await db
    .insert(learningResources)
    .values({
      id,
      titleId: input.titleId,
      titleEn: input.titleEn,
      descriptionId: input.descriptionId,
      descriptionEn: input.descriptionEn,
      url: input.url,
      sortOrder,
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

/** Current sort-order slots for the requested rows, in the same order the admin list renders them. */
export async function listResourceSortOrders(db: Database, ids: string[]) {
  return db
    .select({ id: learningResources.id, sortOrder: learningResources.sortOrder })
    .from(learningResources)
    .where(inArray(learningResources.id, ids))
    .orderBy(
      asc(learningResources.sortOrder),
      asc(learningResources.titleId),
      asc(learningResources.id),
    );
}

/** Writes only the slots that move, in one D1 batch; only the dragged row gets a new timestamp. */
export async function applyResourceSortOrders(
  db: Database,
  updates: Array<{ id: string; sortOrder: number; touch?: boolean }>,
): Promise<void> {
  const [first, ...rest] = updates;
  if (!first) return;
  const updatedAt = new Date();
  const statementFor = (update: { id: string; sortOrder: number; touch?: boolean }) =>
    db
      .update(learningResources)
      .set(
        update.touch ? { sortOrder: update.sortOrder, updatedAt } : { sortOrder: update.sortOrder },
      )
      .where(eq(learningResources.id, update.id));
  await db.batch([statementFor(first), ...rest.map(statementFor)]);
}
