import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { courses } from "@g13/db/schema/courses";
import { getLecturerDirectory } from "@/routes/_public/lecturers/-server/read.service";
import { createTestPlatformProxy } from "@/test/database";
import { COURSE_ADMIN_ERRORS, type CourseAdminResult } from "../-shared/errors";
import { changeCourseLifecycle, createCourse, inspectCourses, updateCourse } from "./service";

function resultData<T>(result: CourseAdminResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}

it("enforces RBAC, CRUD, soft delete, restore, and public visibility for courses", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const admin = { id: "admin", role: "admin" };
    const maintainer = { id: "maintainer", role: "maintainer" };

    for (const role of [undefined, null, "user", "moderator", "admin,user"]) {
      const actor = { id: "user", role };
      expect(await inspectCourses(db, actor)).toEqual({
        data: null,
        error: COURSE_ADMIN_ERRORS.FORBIDDEN,
      });
      expect(
        await createCourse(db, actor, { code: "CS101", nameId: "Dasar", nameEn: "Basics" }),
      ).toEqual({ data: null, error: COURSE_ADMIN_ERRORS.FORBIDDEN });
    }

    const first = resultData(
      await createCourse(db, maintainer, {
        code: "PACS262301",
        nameId: "Basis Data",
        nameEn: "Database",
      }),
    );
    const second = resultData(
      await createCourse(db, admin, {
        code: "PACS262302",
        nameId: "Basis Data Lanjut",
        nameEn: "Advanced Database",
      }),
    );
    expect(first.id).toBe("PACS262301");
    expect(second.id).toBe("PACS262302");

    // The code is the identity now, so a duplicate is rejected instead of getting a suffix.
    expect(
      await createCourse(db, admin, {
        code: "PACS262301",
        nameId: "Duplikat",
        nameEn: "Duplicate",
      }),
    ).toEqual({ data: null, error: COURSE_ADMIN_ERRORS.COURSE_CODE_TAKEN });

    expect(resultData(await inspectCourses(db, maintainer, 0, "active")).counts).toEqual({
      active: 2,
      deleted: 0,
    });
    expect(
      await updateCourse(db, maintainer, {
        courseId: first.id,
        nameId: "Basis Data I",
        nameEn: "Database I",
      }),
    ).toEqual({ data: { courseId: first.id }, error: null });

    // Soft-delete hides course from public catalog and moves it to deleted tab.
    expect(
      await changeCourseLifecycle(db, admin, { courseId: first.id, action: "delete" }),
    ).toEqual({ data: { courseId: first.id, action: "delete" }, error: null });
    expect((await getLecturerDirectory(db)).courses.map((row) => row.id)).toEqual([second.id]);
    const deletedList = resultData(await inspectCourses(db, admin, 0, "deleted"));
    expect(deletedList.rows.map((r) => r.id)).toEqual([first.id]);
    expect(deletedList.counts).toEqual({ active: 1, deleted: 1 });

    // Editing or deleting an already-deleted course is rejected.
    expect(
      await updateCourse(db, admin, {
        courseId: first.id,
        nameId: "X",
        nameEn: "X",
      }),
    ).toEqual({ data: null, error: COURSE_ADMIN_ERRORS.COURSE_ACTION_UNAVAILABLE });
    expect(
      await changeCourseLifecycle(db, admin, { courseId: first.id, action: "delete" }),
    ).toEqual({ data: null, error: COURSE_ADMIN_ERRORS.COURSE_ACTION_UNAVAILABLE });

    // Restore brings it back to active and public catalog.
    expect(
      await changeCourseLifecycle(db, maintainer, { courseId: first.id, action: "restore" }),
    ).toEqual({ data: { courseId: first.id, action: "restore" }, error: null });
    const publicDirectory = await getLecturerDirectory(db);
    expect(publicDirectory.courses.map((row) => row.id).sort()).toEqual([first.id, second.id]);
    expect(
      await changeCourseLifecycle(db, maintainer, { courseId: first.id, action: "restore" }),
    ).toEqual({ data: null, error: COURSE_ADMIN_ERRORS.COURSE_ACTION_UNAVAILABLE });
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("filters the entire course catalog before paging and keeps status totals", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const admin = { id: "admin", role: "admin" };
    const inserts = Array.from({ length: 54 }, (_, index) => {
      const code = `CS${100 + index}`;
      return db.insert(courses).values({
        id: code,
        code,
        nameId: index > 50 ? "Basis Data 100%" : "Algoritma",
        nameEn: index > 50 ? "Database Systems Édition" : "Algorithms",
        deletedAt: index === 53 ? new Date() : null,
      });
    });
    await db.batch([inserts[0]!, ...inserts.slice(1)]);
    const firstPage = resultData(await inspectCourses(db, admin));
    expect(firstPage.rows.slice(0, 50).some((row) => row.id === "CS151")).toBe(false);
    const search = resultData(await inspectCourses(db, admin, 0, "active", "BASIS DATA 100%"));
    expect(search.rows.map(({ id }) => id)).toEqual(["CS151", "CS152"]);
    expect(search.total).toBe(2);
    expect(search.counts).toEqual({ active: 53, deleted: 1 });
    const pageTwo = resultData(await inspectCourses(db, admin, 50, "active", "CS"));
    expect(pageTwo.rows.map(({ id }) => id)).toEqual(["CS150", "CS151", "CS152"]);
    expect(pageTwo.total).toBe(53);
    const deleted = resultData(
      await inspectCourses(db, admin, 0, "deleted", "database systems Édition"),
    );
    expect(deleted.rows.map(({ id }) => id)).toEqual(["CS153"]);
    expect(deleted.total).toBe(1);
    expect(resultData(await inspectCourses(db, admin, 0, "active", "_")).total).toBe(0);
  } finally {
    await platform.dispose();
  }
}, 30_000);
