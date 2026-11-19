import { expect, test } from "bun:test";
import { authUser, courses, createDatabase, lecturers } from "@g13/db";
import { createTestPlatformProxy } from "@/test/database";
import { submitReview } from "@/routes/lecturers/-server/submission.service";
import { approveUserRole } from "@/routes/dashboard/_authenticated/users/-server/service";
import { NOTIFICATION_ERRORS } from "../-shared/errors";
import {
  archiveUserNotification,
  getUnreadNotificationCount,
  inspectNotifications,
  readAllNotifications,
  readNotification,
} from "./service";

async function seedFixtures(db: ReturnType<typeof createDatabase>) {
  const now = new Date("2026-11-19T00:00:00Z");
  await db.insert(authUser).values([
    {
      id: "admin-1",
      name: "Admin One",
      email: "admin1@example.com",
      role: "admin",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "maintainer-1",
      name: "Maintainer One",
      email: "maintainer1@example.com",
      role: "maintainer",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-1",
      name: "New User",
      email: "user1@example.com",
      role: "user",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  await db.insert(lecturers).values({ id: "afiahayati", name: "Afiahayati" });
  await db.insert(courses).values({
    id: "review-2026-PACS262102",
    code: "PACS262102",
    nameId: "Logika Informatika",
    nameEn: "Logic for Computer Science",
  });
}

test("emits notifications on review submission and role update, and enforces recipient isolation", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedFixtures(db);

    const reviewResult = await submitReview(
      db,
      {
        lecturerId: "afiahayati",
        courseId: "review-2026-PACS262102",
        termLabel: "2026/2027 Ganjil",
        anonymous: true,
        authorName: "",
        clarity: 5,
        support: 4,
        organization: 5,
        body: "Clear lectures and helpful feedback.",
      },
      { ip: "127.0.0.1", secret: "a".repeat(32), now: Date.parse("2026-11-19T01:00:00Z") },
    );
    expect(reviewResult.error).toBeNull();

    const adminInbox = await inspectNotifications(db, { id: "admin-1", role: "admin" });
    expect(adminInbox.error).toBeNull();
    expect(adminInbox.data?.counts).toEqual({ all: 1, unread: 1, archived: 0 });
    expect(adminInbox.data?.rows[0]?.type).toBe("review.created");
    expect(adminInbox.data?.rows[0]?.payload.lecturerName).toBe("Afiahayati");

    const maintainerInbox = await inspectNotifications(db, {
      id: "maintainer-1",
      role: "maintainer",
    });
    expect(maintainerInbox.data?.counts.unread).toBe(1);

    const userInboxBefore = await inspectNotifications(db, { id: "user-1", role: "user" });
    expect(userInboxBefore.data?.counts.all).toBe(0);

    // Recipient isolation: user-1 cannot mark admin-1's notification as read or archive it
    const adminNotificationId = adminInbox.data!.rows[0]!.id;
    const crossRead = await readNotification(
      db,
      { id: "user-1", role: "user" },
      adminNotificationId,
    );
    expect(crossRead.error).toBe(NOTIFICATION_ERRORS.NOT_FOUND);
    const crossArchive = await archiveUserNotification(
      db,
      { id: "user-1", role: "user" },
      adminNotificationId,
    );
    expect(crossArchive.error).toBe(NOTIFICATION_ERRORS.NOT_FOUND);

    // Role update notifies target user
    const roleResult = await approveUserRole(
      db,
      { id: "admin-1", role: "admin" },
      { userId: "user-1", role: "maintainer" },
    );
    expect(roleResult.error).toBeNull();

    const userInboxAfter = await inspectNotifications(db, { id: "user-1", role: "maintainer" });
    expect(userInboxAfter.data?.counts).toEqual({ all: 1, unread: 1, archived: 0 });
    expect(userInboxAfter.data?.rows[0]?.type).toBe("user.role_updated");
    expect(userInboxAfter.data?.rows[0]?.payload.role).toBe("maintainer");
  } finally {
    await platform.dispose();
  }
});

test("supports read, mark-all-read, archive, and filtered views", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedFixtures(db);

    const baseNow = Date.parse("2026-11-19T02:00:00Z");
    for (let i = 0; i < 2; i++) {
      await submitReview(
        db,
        {
          lecturerId: "afiahayati",
          courseId: "review-2026-PACS262102",
          termLabel: "2026/2027 Ganjil",
          anonymous: false,
          authorName: `Student ${i + 1}`,
          clarity: 4,
          support: 4,
          organization: 4,
          body: `Review body number ${i + 1} with enough length.`,
        },
        { ip: "127.0.0.1", secret: "a".repeat(32), now: baseNow + i * 1000 },
      );
    }

    const before = await inspectNotifications(db, { id: "admin-1", role: "admin" }, 0, "all");
    expect(before.data?.counts).toEqual({ all: 2, unread: 2, archived: 0 });
    const firstId = before.data!.rows[0]!.id;
    const secondId = before.data!.rows[1]!.id;

    // Mark single as read
    const readOne = await readNotification(db, { id: "admin-1", role: "admin" }, firstId);
    expect(readOne.error).toBeNull();

    const unreadCount = await getUnreadNotificationCount(db, { id: "admin-1", role: "admin" });
    expect(unreadCount.data?.unread).toBe(1);

    const unreadOnly = await inspectNotifications(
      db,
      { id: "admin-1", role: "admin" },
      0,
      "unread",
    );
    expect(unreadOnly.data?.rows.map((r) => r.id)).toEqual([secondId]);

    // Mark all read
    await readAllNotifications(db, { id: "admin-1", role: "admin" });
    expect(
      (await getUnreadNotificationCount(db, { id: "admin-1", role: "admin" })).data?.unread,
    ).toBe(0);

    // Archive one
    const archived = await archiveUserNotification(db, { id: "admin-1", role: "admin" }, firstId);
    expect(archived.error).toBeNull();

    const afterArchive = await inspectNotifications(
      db,
      { id: "admin-1", role: "admin" },
      0,
      "archived",
    );
    expect(afterArchive.data?.counts).toEqual({ all: 1, unread: 0, archived: 1 });
    expect(afterArchive.data?.rows.map((r) => r.id)).toEqual([firstId]);
  } finally {
    await platform.dispose();
  }
});

test("hides privileged notifications once the recipient loses the role", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedFixtures(db);
    await submitReview(
      db,
      {
        lecturerId: "afiahayati",
        courseId: "review-2026-PACS262102",
        termLabel: "2026/2027 Ganjil",
        anonymous: false,
        authorName: "Named Student",
        clarity: 4,
        support: 4,
        organization: 4,
        body: "Named review that only moderators should see in notifications.",
      },
      { ip: "127.0.0.1", secret: "a".repeat(32), now: Date.parse("2026-11-19T03:00:00Z") },
    );
    await approveUserRole(
      db,
      { id: "admin-1", role: "admin" },
      { userId: "maintainer-1", role: "user" },
    );

    const demoted = { id: "maintainer-1", role: "user" };
    const inbox = await inspectNotifications(db, demoted);
    expect(inbox.data?.rows.map((row) => row.type)).toEqual(["user.role_updated"]);
    expect(inbox.data?.counts).toEqual({ all: 1, unread: 1, archived: 0 });
    expect((await getUnreadNotificationCount(db, demoted)).data?.unread).toBe(1);

    const stillMaintainer = await inspectNotifications(db, {
      id: "maintainer-1",
      role: "maintainer",
    });
    const reviewNotification = stillMaintainer.data!.rows.find(
      (row) => row.type === "review.created",
    )!;
    expect((await readNotification(db, demoted, reviewNotification.id)).error).toBe(
      NOTIFICATION_ERRORS.NOT_FOUND,
    );
    expect((await archiveUserNotification(db, demoted, reviewNotification.id)).error).toBe(
      NOTIFICATION_ERRORS.NOT_FOUND,
    );

    await readAllNotifications(db, demoted);
    const restored = await inspectNotifications(db, { id: "maintainer-1", role: "maintainer" });
    expect(restored.data?.counts.unread).toBe(1);
  } finally {
    await platform.dispose();
  }
});
