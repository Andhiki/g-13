import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { listPublicResources } from "@/routes/_public/resources/-server/repository";
import { createTestPlatformProxy } from "@/test/database";
import { RESOURCE_ADMIN_ERRORS, type ResourceAdminResult } from "../-shared/errors";
import {
  reorderResourcesSchema,
  resourceFieldsSchema,
  type CreateResourceInput,
} from "../-shared/schemas";
import {
  changeResourceLifecycle,
  createResource,
  inspectResources,
  reorderResources,
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
    ...overrides,
  };
}

it("enforces RBAC, CRUD, drag ordering, soft delete, restore, and public visibility for resources", async () => {
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

    // New resources append after the current maximum and get stable slug ids.
    const first = resultData(await createResource(db, maintainer, resourceFields()));
    const second = resultData(
      await createResource(
        db,
        admin,
        resourceFields({
          titleId: "roadmap.sh",
          titleEn: "roadmap.sh",
          descriptionId: "Panduan jalur karier teknologi.",
          descriptionEn: "A guide to technology career paths.",
          url: "https://roadmap.sh",
        }),
      ),
    );
    const third = resultData(
      await createResource(
        db,
        admin,
        resourceFields({
          titleId: "CS50’s Introduction to Computer Science",
          titleEn: "CS50’s Introduction to Computer Science",
          descriptionId: "Kursus ilmu komputer pengantar dari Harvard.",
          descriptionEn: "Harvard's introductory computer science course.",
          url: "https://cs50.harvard.edu/x/",
        }),
      ),
    );
    expect(first.id).toBe("dike-ugm-skripsi-latex-template");
    expect(second.id).toBe("roadmap-sh");
    expect(third.id).toBe("cs50-s-introduction-to-computer-science");

    const activeList = resultData(await inspectResources(db, maintainer, 0, "active"));
    expect(activeList.rows.map((row) => row.id)).toEqual([first.id, second.id, third.id]);
    expect(activeList.rows.map((row) => row.sortOrder)).toEqual([0, 1, 2]);
    expect(activeList.counts).toEqual({ active: 3, deleted: 0 });
    const timestampsBefore = new Map(
      activeList.rows.map((row) => [row.id, row.updatedAt.getTime()]),
    );

    // The public read keeps editorial order and never exposes timestamps.
    const publicRows = await listPublicResources(db);
    expect(publicRows.map((row) => row.id)).toEqual([first.id, second.id, third.id]);
    expect(publicRows[0]).toEqual({
      id: first.id,
      titleId: resourceFields().titleId,
      titleEn: resourceFields().titleEn,
      descriptionId: resourceFields().descriptionId,
      descriptionEn: resourceFields().descriptionEn,
      url: resourceFields().url,
    });

    // Drag ordering shifts only the rows between the old and new position.
    expect(
      await reorderResources(db, maintainer, {
        movedId: third.id,
        orderedIds: [third.id, first.id, second.id],
      }),
    ).toEqual({
      data: { movedId: third.id, orderedIds: [third.id, first.id, second.id] },
      error: null,
    });
    const afterReorder = resultData(await inspectResources(db, maintainer));
    expect(afterReorder.rows.map((row) => row.id)).toEqual([third.id, first.id, second.id]);
    expect(afterReorder.rows.map((row) => row.sortOrder)).toEqual([0, 1, 2]);
    for (const row of afterReorder.rows) {
      const before = timestampsBefore.get(row.id);
      if (row.id === third.id) {
        expect(row.updatedAt.getTime()).toBeGreaterThanOrEqual(before!);
      } else {
        // Shifted rows keep their content timestamp; only the dragged row is touched.
        expect(row.updatedAt.getTime()).toBe(before!);
      }
    }
    expect((await listPublicResources(db)).map((row) => row.id)).toEqual([
      third.id,
      first.id,
      second.id,
    ]);

    // Editing only touches copy and links; the drag order stays put.
    expect(
      await updateResource(db, maintainer, {
        resourceId: first.id,
        ...resourceFields({ descriptionEn: "Updated copy." }),
      }),
    ).toEqual({ data: { resourceId: first.id }, error: null });
    const afterEdit = resultData(await inspectResources(db, maintainer));
    expect(afterEdit.rows.map((row) => row.id)).toEqual([third.id, first.id, second.id]);
    expect(afterEdit.rows.find((row) => row.id === first.id)?.descriptionEn).toBe("Updated copy.");

    // Soft delete hides the row from the public list and files it under deleted.
    expect(
      await changeResourceLifecycle(db, admin, { resourceId: first.id, action: "delete" }),
    ).toEqual({ data: { resourceId: first.id, action: "delete" }, error: null });
    expect((await listPublicResources(db)).map((row) => row.id)).toEqual([third.id, second.id]);
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
      third.id,
      first.id,
      second.id,
    ]);
    expect(
      await changeResourceLifecycle(db, maintainer, { resourceId: first.id, action: "restore" }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE });

    // Mutating or reordering a nonexistent resource is unavailable, not forbidden.
    expect(
      await updateResource(db, admin, {
        resourceId: "missing",
        ...resourceFields({ titleEn: "Missing" }),
      }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE });
    expect(
      await changeResourceLifecycle(db, admin, { resourceId: "missing", action: "delete" }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE });
    expect(
      await reorderResources(db, admin, {
        movedId: second.id,
        orderedIds: [second.id, "missing"],
      }),
    ).toEqual({
      data: null,
      error: RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE,
    });

    // Non-maintainers cannot use lifecycle, mutation, or reorder endpoints either.
    expect(
      await changeResourceLifecycle(db, forbidden, { resourceId: second.id, action: "delete" }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN });
    expect(
      await updateResource(db, forbidden, {
        resourceId: second.id,
        ...resourceFields({ titleEn: "Forbidden" }),
      }),
    ).toEqual({ data: null, error: RESOURCE_ADMIN_ERRORS.FORBIDDEN });
    expect(
      await reorderResources(db, forbidden, {
        movedId: second.id,
        orderedIds: [second.id, third.id],
      }),
    ).toEqual({
      data: null,
      error: RESOURCE_ADMIN_ERRORS.FORBIDDEN,
    });
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("keeps deleted rows' order slots when reordering the active page", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const admin = { id: "admin", role: "admin" };
    const alpha = resultData(
      await createResource(
        db,
        admin,
        resourceFields({ titleId: "Alpha", titleEn: "Alpha", url: "https://alpha.example" }),
      ),
    );
    const beta = resultData(
      await createResource(
        db,
        admin,
        resourceFields({ titleId: "Beta", titleEn: "Beta", url: "https://beta.example" }),
      ),
    );
    const gamma = resultData(
      await createResource(
        db,
        admin,
        resourceFields({ titleId: "Gamma", titleEn: "Gamma", url: "https://gamma.example" }),
      ),
    );

    await changeResourceLifecycle(db, admin, { resourceId: beta.id, action: "delete" });
    expect(
      await reorderResources(db, admin, {
        movedId: gamma.id,
        orderedIds: [gamma.id, alpha.id],
      }),
    ).toEqual({
      data: { movedId: gamma.id, orderedIds: [gamma.id, alpha.id] },
      error: null,
    });

    // Only the dragged rows swap slots; the deleted row keeps its place between them.
    expect((await listPublicResources(db)).map((row) => row.id)).toEqual([gamma.id, alpha.id]);
    const deleted = resultData(await inspectResources(db, admin, 0, "deleted"));
    expect(deleted.rows.map((row) => row.id)).toEqual([beta.id]);

    await changeResourceLifecycle(db, admin, { resourceId: beta.id, action: "restore" });
    expect((await listPublicResources(db)).map((row) => row.id)).toEqual([
      gamma.id,
      beta.id,
      alpha.id,
    ]);
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("validates bilingual copy, normalizes links, and validates reorder payloads", () => {
  expect(resourceFieldsSchema.safeParse(resourceFields()).success).toBe(true);

  const normalized = (url: string) => resourceFieldsSchema.parse(resourceFields({ url })).url;
  expect(normalized("  example.com/path/  ")).toBe("https://example.com/path/");
  expect(normalized("http://example.com/")).toBe("https://example.com");
  expect(normalized("https://example.com/")).toBe("https://example.com");
  expect(normalized("https://example.com/foo/")).toBe("https://example.com/foo/");
  expect(normalized("https://example.com/?q=1")).toBe("https://example.com?q=1");
  expect(normalized("//example.com")).toBe("https://example.com");

  for (const url of ["/exam", "https://", "ftp://example.com", "mailto:test@example.com"]) {
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

  expect(reorderResourcesSchema.safeParse({ movedId: "cs50", orderedIds: ["cs50"] }).success).toBe(
    true,
  );
  expect(reorderResourcesSchema.safeParse({ movedId: "cs50", orderedIds: [] }).success).toBe(false);
  expect(
    reorderResourcesSchema.safeParse({ movedId: "cs50", orderedIds: ["cs50", "cs50"] }).success,
  ).toBe(false);
  expect(
    reorderResourcesSchema.safeParse({ movedId: "cs50", orderedIds: ["cs50", ""] }).success,
  ).toBe(false);
  expect(
    reorderResourcesSchema.safeParse({ movedId: "cs50", orderedIds: ["roadmap"] }).success,
  ).toBe(false);
  expect(reorderResourcesSchema.safeParse({ orderedIds: ["cs50"] }).success).toBe(false);
});
