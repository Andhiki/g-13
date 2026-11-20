import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { authUser } from "@g13/db/schema/auth";
import { getActiveAnnouncements } from "@/routes/_public/-announcements/service";
import { createTestPlatformProxy } from "@/test/database";
import { ANNOUNCEMENT_ADMIN_ERRORS, type AnnouncementAdminResult } from "../-shared/errors";
import {
  changeAnnouncementLifecycle,
  createAnnouncement,
  inspectAnnouncements,
  updateAnnouncement,
} from "./service";

const day = 24 * 60 * 60 * 1000;

function createBulletin(input: Partial<Parameters<typeof createAnnouncement>[2]> = {}) {
  return {
    slug: "midterm-schedule",
    titleId: "Jadwal UTS sudah terbit",
    titleEn: "Midterm schedule is out",
    bodyId: "Cek arsip ujian untuk soal UTS tahun-tahun sebelumnya.",
    bodyEn: "Check the exam archive for past midterm papers.",
    ctaHref: "/exam",
    ctaLabelId: "Buka arsip",
    ctaLabelEn: "Open archive",
    startsAt: Date.now() - day,
    endsAt: null,
    enabled: true,
    ...input,
  };
}

function resultData<T>(result: AnnouncementAdminResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}

async function seedUsers(db: ReturnType<typeof createDatabase>) {
  const now = new Date();
  await db.insert(authUser).values({
    id: "admin-1",
    name: "Admin One",
    email: "admin1@example.com",
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });
}

it("enforces RBAC, CRUD, slug conflicts, toggles, and public visibility for announcements", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedUsers(db);
    const admin = { id: "admin-1", role: "admin" };
    const maintainer = { id: "maintainer", role: "maintainer" };
    const now = Date.now();

    for (const role of [undefined, null, "user", "maintainer"]) {
      const actor = { id: "user", role };
      expect(await inspectAnnouncements(db, actor)).toEqual({
        data: null,
        error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN,
      });
      expect(await createAnnouncement(db, actor, createBulletin())).toEqual({
        data: null,
        error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN,
      });
    }

    // A live, enabled announcement is publicly visible right away.
    const created = resultData(await createAnnouncement(db, admin, createBulletin()));
    expect(created.id).toBeTruthy();
    const live = await getActiveAnnouncements(db, now);
    expect(live.map((row) => row.slug)).toEqual(["midterm-schedule"]);

    // Slug conflicts are rejected.
    expect(await createAnnouncement(db, admin, createBulletin({ titleId: "Duplikat" }))).toEqual({
      data: null,
      error: ANNOUNCEMENT_ADMIN_ERRORS.SLUG_IN_USE,
    });

    // An expiry before the start is rejected.
    expect(
      await createAnnouncement(
        db,
        admin,
        createBulletin({ slug: "backwards", startsAt: now, endsAt: now - day }),
      ),
    ).toEqual({ data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE });

    // Editing keeps the announcement live with new copy.
    expect(
      await updateAnnouncement(db, admin, {
        announcementId: created.id,
        ...createBulletin({ titleId: "Jadwal UTS diperbarui" }),
      }),
    ).toEqual({ data: { announcementId: created.id }, error: null });
    const afterEdit = await getActiveAnnouncements(db, now);
    expect(afterEdit[0]?.titleId).toBe("Jadwal UTS diperbarui");

    // Disabling hides it from the public banner and files it under disabled.
    expect(
      await changeAnnouncementLifecycle(db, admin, {
        announcementId: created.id,
        action: "disable",
      }),
    ).toEqual({
      data: { announcementId: created.id, action: "disable" },
      error: null,
    });
    expect(await getActiveAnnouncements(db, now)).toEqual([]);
    const disabledList = resultData(await inspectAnnouncements(db, admin, 0, "disabled"));
    expect(disabledList.rows.map((row) => row.id)).toEqual([created.id]);
    expect(resultData(await inspectAnnouncements(db, admin, 0, "live")).rows).toEqual([]);

    // Re-enabling brings it back live.
    expect(
      await changeAnnouncementLifecycle(db, admin, {
        announcementId: created.id,
        action: "enable",
      }),
    ).toEqual({ data: { announcementId: created.id, action: "enable" }, error: null });
    expect((await getActiveAnnouncements(db, now)).length).toBe(1);

    // Mutating a nonexistent announcement is unavailable, not forbidden.
    expect(
      await updateAnnouncement(db, admin, {
        announcementId: "missing",
        ...createBulletin({ slug: "other-slug" }),
      }),
    ).toEqual({ data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE });
    expect(
      await changeAnnouncementLifecycle(db, maintainer, {
        announcementId: "missing",
        action: "delete",
      }),
    ).toEqual({ data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN });
    expect(
      await changeAnnouncementLifecycle(db, admin, {
        announcementId: "missing",
        action: "delete",
      }),
    ).toEqual({ data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE });

    // Deleting removes it everywhere.
    expect(
      await changeAnnouncementLifecycle(db, admin, {
        announcementId: created.id,
        action: "delete",
      }),
    ).toEqual({ data: { announcementId: created.id, action: "delete" }, error: null });
    expect(await getActiveAnnouncements(db, now)).toEqual([]);
    const counts = resultData(await inspectAnnouncements(db, admin)).counts;
    expect(counts).toEqual({ live: 0, scheduled: 0, expired: 0, disabled: 0 });
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("schedules announcements by start and expiry windows", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const now = Date.now();
    await seedUsers(db);
    const admin = { id: "admin-1", role: "admin" };

    const scheduled = resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({ slug: "future", startsAt: now + day, endsAt: now + 2 * day }),
      ),
    );
    resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({ slug: "expiring", startsAt: now - day, endsAt: now + day }),
      ),
    );
    const expired = resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({ slug: "expired", startsAt: now - 2 * day, endsAt: now - day }),
      ),
    );

    // Nothing is public at its scheduled slot beyond the future one or ended ones.
    expect((await getActiveAnnouncements(db, now)).map((row) => row.slug)).toEqual(["expiring"]);

    const before = resultData(await inspectAnnouncements(db, admin, 0, "scheduled"));
    expect(before.rows.map((row) => row.id)).toEqual([scheduled.id]);

    const during = await getActiveAnnouncements(db, now + day / 2);
    expect(during.map((row) => row.slug)).toEqual(["expiring"]);

    const afterEverything = await getActiveAnnouncements(db, now + 2 * day);
    expect(afterEverything).toEqual([]);

    const expiredList = resultData(await inspectAnnouncements(db, admin, 0, "expired"));
    expect(expiredList.rows.map((row) => row.id)).toEqual([expired.id]);
    expect(await inspectAnnouncements(db, maintainerActor())).toEqual({
      data: null,
      error: ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN,
    });
  } finally {
    await platform.dispose();
  }
}, 30_000);

function maintainerActor() {
  return { id: "maintainer", role: "maintainer" };
}
