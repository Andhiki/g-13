import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { listPublicResources } from "@/routes/_public/resources/-server/repository";
import { createTestPlatformProxy } from "@/test/database";
import { RESOURCE_ADMIN_ERRORS, type ResourceAdminResult } from "../-shared/errors";
import { resourceFieldsSchema, type CreateResourceInput } from "../-shared/schemas";
import {
  changeResourceLifecycle,
  createResource,
  inspectResources,
  updateResource,
} from "./service";

function resultData<T>(result: ResourceAdminResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}

function resourceFields(overrides: Partial<CreateResourceInput> = {}): CreateResourceInput {
  return {
    titleId: "Template LaTeX Skripsi DIKE UGM",
    titleEn: "DIKE UGM Skripsi LaTeX template",
    descriptionId: "Template proposal dan skripsi yang siap dipakai.",
    descriptionEn: "A ready-to-use proposal and thesis template.",
    url: "https://github.com/vityasyyy/template-skripsi-dike-ugm",
    sortOrder: 0,
    ...overrides,
  };
}

it("enforces RBAC, CRUD, ordering, soft delete, restore, and public visibility for resources", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const admin = { id: "admin", role: "admin" };
    const maintainer = { id: "maintainer", role: "maintainer" };
    const forbidden = { id: "visitor", role: "user" };

    for (const role of [undefined, null, "user", "moderator", "admin,user"]) {
      const actor = { id: "user", role };
      expect(await inspectResources(db, actor)).toEqual({
        data: null,
        error: RESOURCE_ADMIN_ERRORS.FORBIDDEN,
      });
      expect(await createResource(db, actor, resourceFields())).toEqual({
        data: null,
        error: RESOURCE_ADMIN_ERRORS.FORBIDDEN,
      });
    }

    // A new resource appends after the current maximum and gets a stable slug id.
    expect(resultData(await inspectResources(db, maintainer)).nextSortOrder).toBe(0);
    const first = resultData(
      await createResource(db, maintainer, resourceFields({ titleEn: "CS50", sortOrder: 1 })),
    );
    const second = resultData(
      await createResource(
        db,
        admin,
        resourceFields({
          titleId: "roadmap.sh",
          titleEn: "roadmap.sh",
          descriptionId: "Panduan jalur karier teknologi.",
          descriptionEn: "A guide to technology career paths.",
          sortOrder: 0,
          url: "https://roadmap.sh",
        }),
      ),
    );
    const third = resultData(
      await createResource(
        db,
        admin,
        resourceFields({ titleEn: "CS50", sortOrder: 5, url: "https://cs50.harvard.edu/x/" }),
      ),
    );
    expect(first.id).toBe("cs50");
    expect(second.id).toBe("roadmap-sh");
    expect(third.id).toBe("cs50-2");

    const activeList = resultData(await inspectResources(db, maintainer, 0, "active"));
    expect(activeList.rows.map((row) => row.id)).toEqual([second.id, first.id, third.id]);
    expect(activeList.counts).toEqual({ active: 3, deleted: 0 });
    expect(activeList.nextSortOrder).toBe(6);

    // The public read keeps editorial order and never exposes timestamps.
    const publicRows = await listPublicResources(db);
    expect(publicRows.map((row) => row.id)).toEqual([second.id, first.id, third.id]);
    expect(publicRows[0]).toEqual({
      id: second.id,
      titleId: "roadmap.sh",
      titleEn: "roadmap.sh",
      descriptionId: "Panduan jalur karier teknologi.",
      descriptionEn: "A guide to technology career paths.",
      url: "https://roadmap.sh",
    });

    // Editing updates copy, link, order, and the update timestamp.
    expect(
      await updateResource(db, maintainer, {
        resourceId: first.id,
        ...resourceFields({ descriptionEn: "Updated copy.", sortOrder: 10 }),
      }),
    ).toEqual({ data: { resourceId: first.id }, error: null });
    const afterEdit = resultData(await inspectResources(db, maintainer));
    expect(afterEdit.rows.map((row) => row.id)).toEqual([second.id, third.id, first.id]);
    expect(afterEdit.rows.find((row) => row.id === first.id)?.descriptionEn).toBe("Updated copy.");

    // Soft delete hides the row from the public list and files it under deleted.
    expect(
      await changeResourceLifecycle(db, admin, { resourceId: first.id, action: "delete" }),
    ).toEqual({ data: { resourceId: first.id, action: "delete" }, error: null });
    expect((await listPublicResources(db)).map((row) => row.id)).toEqual([second.id, third.id]);
    const deletedList = resultData(await inspectResources(db, admin, 0, "deleted"));
    expect(deletedList.rows.map((row) => row.id)).toEqual([first.id]);
    expect(deletedList.counts).toEqual({ active: 2, deleted: 1 });

    // Deleted rows cannot be edited or deleted twice.
    expect(
      await updateResource(db, admin, {
        resourceId: first.id,
        ...resourceFields({ titleEn: "Changed" }),
      }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE });
    expect(
      await changeResourceLifecycle(db, admin, { resourceId: first.id, action: "delete" }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE });

    // Restoring brings the row back in its stored order; restoring twice is unavailable.
    expect(
      await changeResourceLifecycle(db, maintainer, { resourceId: first.id, action: "restore" }),
    ).toEqual({ data: { resourceId: first.id, action: "restore" }, error: null });
    expect((await listPublicResources(db)).map((row) => row.id)).toEqual([
      second.id,
      third.id,
      first.id,
    ]);
    expect(
      await changeResourceLifecycle(db, maintainer, { resourceId: first.id, action: "restore" }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE });

    // Mutating a nonexistent resource is unavailable, not forbidden.
    expect(
      await updateResource(db, admin, {
        resourceId: "missing",
        ...resourceFields({ titleEn: "Missing" }),
      }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE });
    expect(
      await changeResourceLifecycle(db, admin, { resourceId: "missing", action: "delete" }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE });

    // Non-maintainers cannot use lifecycle or mutation endpoints either.
    expect(
      await changeResourceLifecycle(db, forbidden, { resourceId: second.id, action: "delete" }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN });
    expect(
      await updateResource(db, forbidden, {
        resourceId: second.id,
        ...resourceFields({ titleEn: "Forbidden" }),
      }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN });
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("validates bilingual copy, https links, and the sort order range", () => {
  expect(resourceFieldsSchema.safeParse(resourceFields()).success).toBe(true);
  expect(resourceFieldsSchema.safeParse(resourceFields({ sortOrder: 0 })).success).toBe(true);
  expect(resourceFieldsSchema.safeParse(resourceFields({ sortOrder: 9999 })).success).toBe(true);

  for (const url of [
    "http://example.com",
    "/exam",
    "https://",
    "example.com",
    "ftp://example.com",
  ]) {
    expect(resourceFieldsSchema.safeParse(resourceFields({ url })).success, url).toBe(false);
  }

  expect(resourceFieldsSchema.safeParse(resourceFields({ titleId: "   " })).success).toBe(false);
  expect(resourceFieldsSchema.safeParse(resourceFields({ titleEn: "" })).success).toBe(false);
  expect(resourceFieldsSchema.safeParse(resourceFields({ descriptionId: "" })).success).toBe(false);
  expect(resourceFieldsSchema.safeParse(resourceFields({ descriptionEn: "   " })).success).toBe(
    false,
  );
  expect(resourceFieldsSchema.safeParse(resourceFields({ titleEn: "a".repeat(121) })).success).toBe(
    false,
  );
  expect(
    resourceFieldsSchema.safeParse(resourceFields({ descriptionEn: "a".repeat(401) })).success,
  ).toBe(false);
  for (const sortOrder of [-1, 10_000, 1.5, Number.NaN]) {
    expect(resourceFieldsSchema.safeParse(resourceFields({ sortOrder })).success).toBe(false);
  }
});
