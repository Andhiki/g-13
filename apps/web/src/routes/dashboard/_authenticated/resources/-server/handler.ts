import { createServerFn } from "@tanstack/react-start";
import { authorize } from "@/server/auth-middleware";
import { loadAdminPage, runAdminOperation } from "../../-server/admin-handler";
import { RESOURCE_ADMIN_ERRORS, type ResourceAdminError } from "../-shared/errors";
import {
  createResourceSchema,
  reorderResourcesSchema,
  resourceLifecycleSchema,
  resourcePageSchema,
  updateResourceSchema,
} from "../-shared/schemas";
import {
  changeResourceLifecycle,
  createResource,
  inspectResources,
  reorderResources,
  updateResource,
} from "./service";
import { validateResourceInput } from "./validation";

const resourceErrorStatuses = {
  [RESOURCE_ADMIN_ERRORS.FORBIDDEN]: 403,
  [RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE]: 409,
} satisfies Record<ResourceAdminError, number>;

export const loadAdminResources = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(resourcePageSchema))
  .handler(({ data, context: { session } }) =>
    loadAdminPage(session.user, resourceErrorStatuses, (db) =>
      inspectResources(db, session.user, data.offset, data.status, data.query),
    ),
  );

export const createAdminResource = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(createResourceSchema))
  .handler(({ data, context: { session } }) =>
    runAdminOperation(resourceErrorStatuses, (db) => createResource(db, session.user, data)),
  );

export const updateAdminResource = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(updateResourceSchema))
  .handler(({ data, context: { session } }) =>
    runAdminOperation(resourceErrorStatuses, (db) => updateResource(db, session.user, data)),
  );

export const changeAdminResourceLifecycle = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(resourceLifecycleSchema))
  .handler(({ data, context: { session } }) =>
    runAdminOperation(resourceErrorStatuses, (db) =>
      changeResourceLifecycle(db, session.user, data),
    ),
  );

export const reorderAdminResources = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(reorderResourcesSchema))
  .handler(({ data, context: { session } }) =>
    runAdminOperation(resourceErrorStatuses, (db) => reorderResources(db, session.user, data)),
  );
