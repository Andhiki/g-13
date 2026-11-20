import { expect, test } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { authUser } from "@g13/db/schema/auth";
import { courses } from "@g13/db/schema/courses";
import { lecturers } from "@g13/db/schema/lecturers";
import { notificationEvents, notifications } from "@g13/db/schema/notifications";
import { approveUserRole } from "@/routes/dashboard/_authenticated/users/-server/service";
import { submitReview } from "@/routes/_public/lecturers/-server/submission.service";
import { dispatchNotification, pruneOldNotifications } from "@/server/notifications";
import { createTestPlatformProxy } from "@/test/database";
import { NOTIFICATION_ERRORS } from "../-shared/errors";
import {
  archiveUserNotification,
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

test("dispatches, deduplicates, isolates, filters, and hides notifications after demotion", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedFixtures(db);

    const baseNow = Date.parse("2026-11-19T01:00:00Z");
    const review = await submitReview(
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
      { ip: "127.0.0.1", secret: "a".repeat(32), now: baseNow },
    );
    expect(review.error).toBeNull();

    // Duplicate dedupeKey is ignored.
    const duplicate = await dispatchNotification(db, {
      type: "review.created",
      resourceType: "lecturer_review",
      resourceId: review.data!.reviewId,
      dedupeKey: `review.created:${review.data!.reviewId}`,
      recipients: { roles: ["admin", "maintainer"] },
    });
    expect(duplicate.deduplicated).toBe(true);
    expect(duplicate.recipientCount).toBe(0);

    const admin = { id: "admin-1", role: "admin" };
    const adminInbox = await inspectNotifications(db, admin);
    expect(adminInbox.data?.rows).toHaveLength(1);
    expect(
      (await inspectNotifications(db, { id: "user-1", role: "user" })).data?.rows,
    ).toHaveLength(0);

    // Recipient isolation blocks cross-user mutations.
    const adminNotifId = adminInbox.data!.rows[0]!.id;
    expect((await readNotification(db, { id: "user-1", role: "user" }, adminNotifId)).error).toBe(
      NOTIFICATION_ERRORS.NOT_FOUND,
    );
    expect(
      (await archiveUserNotification(db, { id: "user-1", role: "user" }, adminNotifId)).error,
    ).toBe(NOTIFICATION_ERRORS.NOT_FOUND);

    // Read, mark-all-read, archive, and filter transitions.
    expect((await readNotification(db, admin, adminNotifId)).error).toBeNull();
    expect((await inspectNotifications(db, admin, null, "unread")).data?.rows).toHaveLength(0);
    expect((await archiveUserNotification(db, admin, adminNotifId)).error).toBeNull();
    const archived = await inspectNotifications(db, admin, null, "archived");
    expect(archived.data?.rows.map((row) => row.id)).toEqual([adminNotifId]);

    // Demoting a maintainer notifies them and hides privileged review notifications.
    await approveUserRole(db, admin, { userId: "maintainer-1", role: "user" });
    const demoted = { id: "maintainer-1", role: "user" };
    const demotedInbox = await inspectNotifications(db, demoted);
    expect(demotedInbox.data?.rows.map((row) => row.type)).toEqual(["user.role_updated"]);

    const reviewNotif = (
      await inspectNotifications(db, { id: "maintainer-1", role: "maintainer" })
    ).data!.rows.find((row) => row.type === "review.created")!;
    expect((await readNotification(db, demoted, reviewNotif.id)).error).toBe(
      NOTIFICATION_ERRORS.NOT_FOUND,
    );
    await readAllNotifications(db, demoted);
    const stillUnread = await inspectNotifications(
      db,
      { id: "maintainer-1", role: "maintainer" },
      null,
      "unread",
    );
    expect(stillUnread.data?.rows.map((row) => row.id)).toEqual([reviewNotif.id]);
  } finally {
    await platform.dispose();
  }
}, 30_000);

test("prunes notifications and orphaned events older than 90 days", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedFixtures(db);

    const now = Date.parse("2026-11-19T03:00:00Z");
    const dayMs = 24 * 60 * 60 * 1000;
    await dispatchNotification(db, {
      type: "review.created",
      resourceType: "lecturer_review",
      resourceId: "old-review",
      recipients: { roles: ["admin"] },
      now: now - 91 * dayMs,
    });
    await dispatchNotification(db, {
      type: "review.created",
      resourceType: "lecturer_review",
      resourceId: "recent-review",
      recipients: { roles: ["admin"] },
      now: now - 10 * dayMs,
    });

    await pruneOldNotifications(db, { olderThanDays: 90, now });
    expect((await db.select().from(notificationEvents)).map((row) => row.resourceId)).toEqual([
      "recent-review",
    ]);
    expect(await db.select().from(notifications)).toHaveLength(1);
  } finally {
    await platform.dispose();
  }
}, 30_000);

test("continues a notification inbox without gaps when timestamps tie and newer rows arrive", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedFixtures(db);
    const admin = { id: "admin-1", role: "admin" };
    const createdAt = new Date("2026-11-19T00:00:00Z");
    const ids = Array.from({ length: 53 }, (_, index) => `item-${String(index).padStart(2, "0")}`);
    for (const offset of [0, 10, 20, 30, 40, 50]) {
      const batch = ids.slice(offset, offset + 10);
      await db.insert(notificationEvents).values(
        batch.map((id) => ({
          id,
          type: "review.created",
          resourceType: "lecturer_review",
          resourceId: id,
          createdAt,
        })),
      );
      await db
        .insert(notifications)
        .values(batch.map((id) => ({ id, eventId: id, recipientId: admin.id, createdAt })));
    }

    const first = (await inspectNotifications(db, admin)).data;
    if (!first?.nextCursor) throw new Error("Expected a second page");
    expect(first.rows.map(({ id }) => id)).toEqual(ids.slice().reverse().slice(0, 50));

    await db.insert(notificationEvents).values({
      id: "new",
      type: "review.created",
      resourceType: "lecturer_review",
      resourceId: "new",
      createdAt,
    });
    await db.insert(notifications).values({
      id: "new",
      eventId: "new",
      recipientId: admin.id,
      createdAt: new Date(createdAt.getTime() + 1),
    });
    const second = (await inspectNotifications(db, admin, first.nextCursor)).data;
    expect(second?.rows.map(({ id }) => id)).toEqual(["item-02", "item-01", "item-00"]);
    expect(second?.nextCursor).toBeNull();
  } finally {
    await platform.dispose();
  }
});
