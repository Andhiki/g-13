import { expect, test } from "bun:test";
import { authUser } from "@g13/db/schema/auth";
import { createDatabase } from "@g13/db/client";
import { notificationEvents, notifications } from "@g13/db/schema/notifications";
import { createTestPlatformProxy } from "@/test/database";
import { dispatchNotification, pruneOldNotifications } from "./notifications";

async function seedUsers(db: ReturnType<typeof createDatabase>) {
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
      name: "Regular User",
      email: "user1@example.com",
      role: "user",
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

test("dispatches batched role-based and direct notifications with deduplication", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedUsers(db);

    const first = await dispatchNotification(db, {
      type: "review.created",
      resourceType: "lecturer_review",
      resourceId: "review-1",
      payload: { lecturerName: "Afiahayati", courseCode: "PACS262102", authorName: "Anonymous" },
      dedupeKey: "review.created:review-1",
      recipients: { roles: ["admin", "maintainer"] },
    });

    expect(first.eventId).not.toBeNull();
    expect(first.recipientCount).toBe(2);
    expect(first.deduplicated).toBe(false);

    const duplicate = await dispatchNotification(db, {
      type: "review.created",
      resourceType: "lecturer_review",
      resourceId: "review-1",
      payload: { lecturerName: "Afiahayati", courseCode: "PACS262102", authorName: "Anonymous" },
      dedupeKey: "review.created:review-1",
      recipients: { roles: ["admin", "maintainer"] },
    });

    expect(duplicate.eventId).toBe(first.eventId);
    expect(duplicate.recipientCount).toBe(0);
    expect(duplicate.deduplicated).toBe(true);

    const direct = await dispatchNotification(db, {
      type: "user.role_updated",
      resourceType: "user",
      resourceId: "user-1",
      actorId: "admin-1",
      payload: { role: "maintainer" },
      recipients: { userIds: ["user-1"], excludeUserIds: ["admin-1"] },
    });

    expect(direct.recipientCount).toBe(1);

    const allEvents = await db.select().from(notificationEvents);
    const allInbox = await db.select().from(notifications);
    expect(allEvents).toHaveLength(2);
    expect(allInbox).toHaveLength(3);
  } finally {
    await platform.dispose();
  }
});

test("prunes notifications and orphaned events older than 90 days", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedUsers(db);

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

    const remainingEvents = await db.select().from(notificationEvents);
    const remainingInbox = await db.select().from(notifications);
    expect(remainingEvents).toHaveLength(1);
    expect(remainingEvents[0]?.resourceId).toBe("recent-review");
    expect(remainingInbox).toHaveLength(1);
  } finally {
    await platform.dispose();
  }
});
