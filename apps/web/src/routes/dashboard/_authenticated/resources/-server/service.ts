import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { RESOURCE_ADMIN_ERRORS, type ResourceAdminResult } from "../-shared/errors";
import type {
  CreateResourceInput,
  ResourceLifecycleInput,
  ResourceStatus,
  UpdateResourceInput,
} from "../-shared/schemas";
import {
  createResourceRecord,
  getAdminResourceCounts,
  getNextResourceSortOrder,
  listAdminResources,
  setResourceDeletedState,
  updateResourceRecord,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };

export type ResourceListData = {
  rows: Awaited<ReturnType<typeof listAdminResources>>;
  counts: Awaited<ReturnType<typeof getAdminResourceCounts>>;
  nextSortOrder: number;
};

export async function inspectResources(
  db: Database,
  actor: Actor,
  offset = 0,
  status: ResourceStatus = "active",
): Promise<ResourceAdminResult<ResourceListData>> {
  if (!canModerate(actor.role)) return { data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN };
  const [rows, counts, nextSortOrder] = await Promise.all([
    listAdminResources(db, offset, status),
    getAdminResourceCounts(db),
    getNextResourceSortOrder(db),
  ]);
  return { data: { rows, counts, nextSortOrder }, error: null };
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
