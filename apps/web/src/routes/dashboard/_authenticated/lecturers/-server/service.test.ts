import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import {
  getLecturerDetail,
  getLecturerDirectory,
} from "@/routes/_public/lecturers/-server/read.service";
import { createTestPlatformProxy } from "@/test/database";
import { LECTURER_ADMIN_ERRORS, type LecturerAdminResult } from "../-shared/errors";
import {
  changeLecturerLifecycle,
  createLecturer,
  inspectLecturers,
  updateLecturer,
} from "./service";

function resultData<T>(result: LecturerAdminResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}

it("enforces RBAC, CRUD, soft delete, restore, and public visibility for lecturers", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const admin = { id: "admin", role: "admin" };
    const maintainer = { id: "maintainer", role: "maintainer" };

    for (const role of [undefined, null, "user", "moderator", "admin,user"]) {
      const actor = { id: "user", role };
      expect(await inspectLecturers(db, actor)).toEqual({
        data: null,
        error: LECTURER_ADMIN_ERRORS.FORBIDDEN,
      });
      expect(await createLecturer(db, actor, { name: "Ahmad Ashari" })).toEqual({
        data: null,
        error: LECTURER_ADMIN_ERRORS.FORBIDDEN,
      });
    }

    const first = resultData(await createLecturer(db, maintainer, { name: "Ahmad Ashari" }));
    const duplicate = resultData(await createLecturer(db, admin, { name: "Ahmad Ashari" }));
    expect(first.id).toBe("ahmad-ashari");
    expect(duplicate.id).toBe("ahmad-ashari-2");

    expect(resultData(await inspectLecturers(db, maintainer, 0, "active")).counts).toEqual({
      active: 2,
      deleted: 0,
    });
    expect(
      await updateLecturer(db, maintainer, {
        lecturerId: first.id,
        name: "Prof. Ahmad Ashari",
      }),
    ).toEqual({ data: { lecturerId: first.id }, error: null });

    // Soft-delete hides lecturer from public directory and detail page.
    expect(
      await changeLecturerLifecycle(db, admin, { lecturerId: first.id, action: "delete" }),
    ).toEqual({ data: { lecturerId: first.id, action: "delete" }, error: null });
    expect((await getLecturerDirectory(db)).lecturers.map((row) => row.id)).toEqual([duplicate.id]);
    expect(await getLecturerDetail(db, first.id)).toBeNull();
    const deletedList = resultData(await inspectLecturers(db, admin, 0, "deleted"));
    expect(deletedList.rows.map((r) => r.id)).toEqual([first.id]);
    expect(deletedList.counts).toEqual({ active: 1, deleted: 1 });

    // Editing or deleting an already-deleted lecturer is rejected.
    expect(await updateLecturer(db, admin, { lecturerId: first.id, name: "Edited" })).toEqual({
      data: null,
      error: LECTURER_ADMIN_ERRORS.LECTURER_ACTION_UNAVAILABLE,
    });
    expect(
      await changeLecturerLifecycle(db, admin, { lecturerId: first.id, action: "delete" }),
    ).toEqual({ data: null, error: LECTURER_ADMIN_ERRORS.LECTURER_ACTION_UNAVAILABLE });

    // Restore brings lecturer back to public views.
    expect(
      await changeLecturerLifecycle(db, maintainer, { lecturerId: first.id, action: "restore" }),
    ).toEqual({ data: { lecturerId: first.id, action: "restore" }, error: null });
    expect((await getLecturerDetail(db, first.id))?.lecturer).toMatchObject({
      id: first.id,
      name: "Prof. Ahmad Ashari",
    });
    expect(
      await changeLecturerLifecycle(db, maintainer, { lecturerId: first.id, action: "restore" }),
    ).toEqual({ data: null, error: LECTURER_ADMIN_ERRORS.LECTURER_ACTION_UNAVAILABLE });
  } finally {
    await platform.dispose();
  }
}, 30_000);
