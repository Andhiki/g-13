import { asc, type SQL } from "drizzle-orm";
import { expect, it } from "bun:test";
import { canModerate } from "@g13/auth";
import { createDatabase } from "@g13/db/client";
import { courses } from "@g13/db/schema/courses";
import { createTestPlatformProxy } from "@/test/database";
import { ADMIN_PAGE_SIZE } from "../-shared/admin-pagination";
import { loadAdminList, softDeleteCondition, softDeleteStatuses } from "./admin-list";

function courseList(db: ReturnType<typeof createDatabase>) {
  return {
    canView: canModerate,
    statuses: softDeleteStatuses,
    statusCondition: softDeleteCondition(courses.deletedAt),
    searchColumns: [courses.code, courses.nameEn],
    rows: (where: SQL | undefined, page: { limit: number; offset: number }) =>
      db
        .select({ id: courses.id })
        .from(courses)
        .where(where)
        .orderBy(asc(courses.id))
        .limit(page.limit)
        .offset(page.offset),
    count: async (counts: Record<string, SQL<number>>, where: SQL | undefined) =>
      (await db.select(counts).from(courses).where(where))[0],
  };
}

it("pages a status tab, counts every tab, and totals only what the search matches", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const active = Array.from({ length: ADMIN_PAGE_SIZE + 2 }, (_, index) => ({
      id: `A${String(index).padStart(3, "0")}`,
      code: `A${String(index).padStart(3, "0")}`,
      nameId: "Aljabar",
      nameEn: index % 2 ? "Algebra" : "Geometry",
    }));
    // D1 caps bound parameters per statement, so insert in chunks.
    for (let index = 0; index < active.length; index += 20) {
      await db.insert(courses).values(active.slice(index, index + 20));
    }
    await db
      .insert(courses)
      .values({ id: "D1", code: "D1", nameId: "Lama", nameEn: "Algebra", deletedAt: new Date() });
    const admin = { role: "admin" };
    const list = courseList(db);

    const first = await loadAdminList(list, admin, { offset: 0, status: "active" });
    expect(first?.rows).toHaveLength(ADMIN_PAGE_SIZE);
    expect(first?.counts).toEqual({ active: ADMIN_PAGE_SIZE + 2, deleted: 1 });
    expect(first?.total).toBe(ADMIN_PAGE_SIZE + 2);

    const second = await loadAdminList(list, admin, {
      offset: ADMIN_PAGE_SIZE,
      status: "active",
    });
    expect(second?.rows.map(({ id }) => id)).toEqual(
      active.slice(ADMIN_PAGE_SIZE).map(({ id }) => id),
    );

    // Tab counts ignore the search; the total follows it within the current tab.
    const searched = await loadAdminList(list, admin, {
      offset: 0,
      status: "active",
      query: " algebra ",
    });
    expect(searched?.counts).toEqual({ active: ADMIN_PAGE_SIZE + 2, deleted: 1 });
    expect(searched?.total).toBe((ADMIN_PAGE_SIZE + 2) / 2);
    expect(searched?.rows.every(({ id }) => Number(id.slice(1)) % 2 === 1)).toBe(true);

    const deleted = await loadAdminList(list, admin, {
      offset: 0,
      status: "deleted",
      query: "algebra",
    });
    expect(deleted?.rows.map(({ id }) => id)).toEqual(["D1"]);
    expect(deleted?.total).toBe(1);

    const none = await loadAdminList(list, admin, { offset: 0, status: "active", query: "zz" });
    expect(none).toMatchObject({ rows: [], total: 0 });

    for (const role of [undefined, null, "user"]) {
      expect(await loadAdminList(list, { role }, { offset: 0, status: "active" })).toBeNull();
    }
  } finally {
    await platform.dispose();
  }
}, 30_000);
