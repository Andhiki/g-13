import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { RESOURCE_ADMIN_ERRORS, type ResourceAdminResult } from "../-shared/errors";
import type {
  CreateResourceInput,
  ReorderResourcesInput,
  ResourceLifecycleInput,
  ResourceStatus,
  UpdateResourceInput,
} from "../-shared/schemas";
import {
  applyResourceSortOrders,
  createResourceRecord,
  getAdminResourceCounts,
  listAdminResources,
  listResourceSortOrders,
  setResourceDeletedState,
  updateResourceRecord,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };

export type ResourceListData = {
  rows: Awaited<ReturnType<typeof listAdminResources>>;
  counts: Awaited<ReturnType<typeof getAdminResourceCounts>>;
};

export async function inspectResources(
  db: Database,
  actor: Actor,
  offset = 0,
  status: ResourceStatus = "active",
): Promise<ResourceAdminResult<ResourceListData>> {
  if (!canModerate(actor.role)) return { data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN };
  const [rows, counts] = await Promise.all([
    listAdminResources(db, offset, status),
    getAdminResourceCounts(db),
  ]);
  return { data: { rows, counts }, error: null };
}

export async function createResource(
  db: Database,
  actor: Actor,
  input: CreateResourceInput,
): Promise<ResourceAdminResult<{ id: string }>> {
  if (!canModerate(actor.role)) return { data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN };
  const created = await createResourceRecord(db, input);
  return { data: { id: created.id }, error: null };
}

export async function updateResource(
  db: Database,
  actor: Actor,
  input: UpdateResourceInput,
): Promise<ResourceAdminResult<{ resourceId: string }>> {
  if (!canModerate(actor.role)) return { data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN };
  if (!(await updateResourceRecord(db, input))) {
    return { data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE };
  }
  return { data: { resourceId: input.resourceId }, error: null };
}

export async function changeResourceLifecycle(
  db: Database,
  actor: Actor,
  input: ResourceLifecycleInput,
): Promise<ResourceAdminResult<ResourceLifecycleInput>> {
  if (!canModerate(actor.role)) return { data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN };
  if (!(await setResourceDeletedState(db, input))) {
    return { data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE };
  }
  return { data: input, error: null };
}

export async function reorderResources(
  db: Database,
  actor: Actor,
  input: ReorderResourcesInput,
): Promise<ResourceAdminResult<ReorderResourcesInput>> {
  if (!canModerate(actor.role)) return { data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN };
  const currentRows = await listResourceSortOrders(db, input.orderedIds);
  if (currentRows.length !== input.orderedIds.length) {
    return { data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE };
  }

  const currentOrder = currentRows.map((row) => row.id);
  const slots = currentRows.map((row) => row.sortOrder);
  const oldIndex = currentOrder.indexOf(input.movedId);
  const newIndex = input.orderedIds.indexOf(input.movedId);
  if (oldIndex < 0 || newIndex < 0) {
    return { data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE };
  }

  // A single drag moves one row; every other row keeps its relative order.
  const currentWithoutMoved = currentOrder.filter((id) => id !== input.movedId);
  const nextWithoutMoved = input.orderedIds.filter((id) => id !== input.movedId);
  if (currentWithoutMoved.some((id, index) => id !== nextWithoutMoved[index])) {
    return { data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE };
  }

  if (oldIndex === newIndex) return { data: input, error: null };

  // Shift the slots of only the rows between the old and new position, and touch only
  // the dragged row so the Updated column does not reset for the whole page.
  const updates: Array<{ id: string; sortOrder: number; touch?: boolean }> = [
    { id: input.movedId, sortOrder: slots[newIndex], touch: true },
  ];
  if (newIndex > oldIndex) {
    for (let index = oldIndex + 1; index <= newIndex; index++) {
      updates.push({ id: currentOrder[index], sortOrder: slots[index - 1] });
    }
  } else {
    for (let index = newIndex; index < oldIndex; index++) {
      updates.push({ id: currentOrder[index], sortOrder: slots[index + 1] });
    }
  }

  await applyResourceSortOrders(db, updates);
  return { data: input, error: null };
}
