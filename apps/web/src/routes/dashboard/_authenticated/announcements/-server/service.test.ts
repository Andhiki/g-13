import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { authUser } from "@g13/db/schema/auth";
import { getActiveAnnouncements } from "@/routes/_public/-announcements/service";
import { createTestPlatformProxy } from "@/test/database";
import { announcementFieldsShape } from "../-shared/schemas";
import { ANNOUNCEMENT_ADMIN_ERRORS, type AnnouncementWriteResult } from "../-shared/errors";
import {
  changeAnnouncementLifecycle,
  createAnnouncement,
  inspectAnnouncements,
  updateAnnouncement,
} from "./service";

const day = 24 * 60 * 60 * 1000;

type CreateAnnouncementInput = Parameters<typeof createAnnouncement>[2];

function createBulletin(input: Partial<CreateAnnouncementInput> = {}): CreateAnnouncementInput {
  return {
    titleId: "Jadwal UTS sudah terbit",
    titleEn: "Midterm schedule is out",
    bodyId: "Cek arsip ujian untuk soal UTS tahun-tahun sebelumnya.",
    bodyEn: "Check the exam archive for past midterm papers.",
    ctaHref: "/exam",
    ctaLabelId: "Buka arsip",
    ctaLabelEn: "Open archive",
    startsAt: Date.now() - day,
    endsAt: null,
    countdownAt: null,
    variant: "primary",
    enabled: true,
    ...input,
  };
}

function resultData<T>(result: AnnouncementWriteResult<T>): T {
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

it("enforces RBAC, CRUD, countdown behavior, toggles, and public visibility for announcements", async () => {
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
    const created = resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({ countdownAt: now + day, variant: "error" }),
      ),
    );
    expect(created.id).toBeTruthy();
    const live = await getActiveAnnouncements(db, now);
    expect(live.map((row) => row.id)).toEqual([created.id]);
    expect(live[0]?.variant).toBe("error");
    expect(live[0]?.countdownAt?.getTime()).toBe(now + day);
    expect((await getActiveAnnouncements(db, now + 2 * day)).map((row) => row.id)).toEqual([
      created.id,
    ]);

    // An expiry before the start is rejected.
    expect(
      await createAnnouncement(db, admin, createBulletin({ startsAt: now, endsAt: now - day })),
    ).toEqual({ data: null, error: ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE });

    // Editing keeps the announcement live with new copy.
    expect(
      await updateAnnouncement(db, admin, {
        announcementId: created.id,
        ...createBulletin({ titleId: "Jadwal UTS diperbarui", variant: "neutral" }),
      }),
    ).toEqual({ data: { announcementId: created.id }, error: null });
    const afterEdit = await getActiveAnnouncements(db, now);
    expect(afterEdit[0]?.titleId).toBe("Jadwal UTS diperbarui");
    expect(afterEdit[0]?.variant).toBe("neutral");
    expect(afterEdit[0]?.countdownAt).toBeNull();

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

    // The CTA is optional: an empty link is stored as null and the banner renders without one.
    const withoutCta = resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({
          confirmedConflictIds: [created.id],
          ctaHref: "",
          ctaLabelId: "",
          ctaLabelEn: "",
          startsAt: now - day,
          endsAt: now + day,
        }),
      ),
    );
    const rowsWithNoCta = await getActiveAnnouncements(db, now);
    expect(rowsWithNoCta.find((row) => row.id === withoutCta.id)?.ctaHref).toBeNull();

    // Empty CTA link is a valid form value, so the optional field is actually optional.
    expect(announcementFieldsShape.safeParse(createBulletin({ ctaHref: "" })).success).toBe(true);
    expect(
      announcementFieldsShape.safeParse(createBulletin({ ctaHref: "not-a-link" })).success,
    ).toBe(false);
    expect(
      announcementFieldsShape.parse(createBulletin({ countdownAt: null })).countdownAt,
    ).toBeNull();
    expect(
      announcementFieldsShape.parse({ ...createBulletin(), countdownAt: undefined }).countdownAt,
    ).toBeNull();
    expect(announcementFieldsShape.safeParse(createBulletin({ countdownAt: now })).success).toBe(
      true,
    );
    expect(announcementFieldsShape.safeParse(createBulletin({ countdownAt: 0 })).success).toBe(
      false,
    );
    await changeAnnouncementLifecycle(db, admin, {
      announcementId: withoutCta.id,
      action: "delete",
    });

    // Mutating a nonexistent announcement is unavailable, not forbidden.
    expect(
      await updateAnnouncement(db, admin, {
        announcementId: "missing",
        ...createBulletin(),
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
        createBulletin({ startsAt: now + day, endsAt: now + 2 * day }),
      ),
    );
    const expiring = resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({ startsAt: now - day, endsAt: now + day }),
      ),
    );
    const expired = resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({ startsAt: now - 2 * day, endsAt: now - day }),
      ),
    );

    // Nothing is public at its scheduled slot beyond the future one or ended ones.
    expect((await getActiveAnnouncements(db, now)).map((row) => row.id)).toEqual([expiring.id]);

    const before = resultData(await inspectAnnouncements(db, admin, 0, "scheduled"));
    expect(before.rows.map((row) => row.id)).toEqual([scheduled.id]);

    const during = await getActiveAnnouncements(db, now + day / 2);
    expect(during.map((row) => row.id)).toEqual([expiring.id]);

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

it("requires confirmation for every overlapping enabled window before replacing announcements", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedUsers(db);
    const admin = { id: "admin-1", role: "admin" };
    const now = Date.now();
    const first = resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({
          titleEn: "First",
          startsAt: now - day,
          endsAt: now + day,
        }),
      ),
    );
    const second = resultData(
      await createAnnouncement(
        db,
        admin,
        createBulletin({
          titleEn: "Second",
          startsAt: now + day,
          endsAt: null,
        }),
      ),
    );
    const replacement = createBulletin({ startsAt: now, endsAt: null });
    const conflicts = [
      {
        id: first.id,
        titleEn: "First",
        startsAt: new Date(now - day),
        endsAt: new Date(now + day),
      },
      { id: second.id, titleEn: "Second", startsAt: new Date(now + day), endsAt: null },
    ].sort((a, b) => a.id.localeCompare(b.id));
    const blocked = { data: null, error: "SCHEDULE_CONFLICT" as const, conflicts };
    expect(await createAnnouncement(db, admin, replacement)).toEqual(blocked);

    const draft = resultData(
      await createAnnouncement(db, admin, { ...replacement, enabled: false }),
    );
    expect(
      await updateAnnouncement(db, admin, {
        ...replacement,
        announcementId: draft.id,
        confirmedConflictIds: [first.id],
      }),
    ).toEqual(blocked);
    const enable = { announcementId: draft.id, action: "enable" as const };
    expect(await changeAnnouncementLifecycle(db, admin, enable)).toEqual(blocked);
    expect(
      await changeAnnouncementLifecycle(db, admin, {
        ...enable,
        confirmedConflictIds: [first.id],
      }),
    ).toEqual(blocked);
    expect((await getActiveAnnouncements(db, now)).map(({ id }) => id)).toEqual([first.id]);
    expect((await getActiveAnnouncements(db, now + day)).map(({ id }) => id)).toEqual([second.id]);

    resultData(
      await changeAnnouncementLifecycle(db, admin, {
        ...enable,
        confirmedConflictIds: conflicts.map(({ id }) => id),
      }),
    );
    expect((await getActiveAnnouncements(db, now)).map(({ id }) => id)).toEqual([draft.id]);
    expect((await getActiveAnnouncements(db, now + day)).map(({ id }) => id)).toEqual([draft.id]);
    const successor = resultData(
      await createAnnouncement(db, admin, {
        ...replacement,
        confirmedConflictIds: [draft.id],
      }),
    );
    resultData(
      await updateAnnouncement(db, admin, {
        ...replacement,
        announcementId: draft.id,
        confirmedConflictIds: [successor.id],
      }),
    );
    expect((await getActiveAnnouncements(db, now)).map(({ id }) => id)).toEqual([draft.id]);
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("allows only one of two concurrent overlapping enables to succeed without confirmation", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedUsers(db);
    const admin = { id: "admin-1", role: "admin" };
    const draft = createBulletin({ enabled: false });
    const first = resultData(await createAnnouncement(db, admin, draft));
    const second = resultData(await createAnnouncement(db, admin, draft));
    const results = await Promise.all(
      [first, second].map(({ id }) =>
        changeAnnouncementLifecycle(db, admin, { announcementId: id, action: "enable" }),
      ),
    );
    expect(results.filter(({ error }) => error === null)).toHaveLength(1);
    expect(results.filter(({ error }) => error === "SCHEDULE_CONFLICT")).toHaveLength(1);
    expect(await getActiveAnnouncements(db, Date.now())).toHaveLength(1);
  } finally {
    await platform.dispose();
  }
}, 30_000);
