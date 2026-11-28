import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { authUser } from "@g13/db/schema/auth";
import { courses } from "@g13/db/schema/courses";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import { lecturers } from "@g13/db/schema/lecturers";
import { createTestPlatformProxy } from "@/test/database";
import { inspectDashboardHome } from "./service";

const now = Date.UTC(2026, 10, 28);

function review(id: string, status: "pending" | "published", createdAt: number) {
  return {
    id,
    lecturerId: "lecturer",
    courseId: "course",
    termLabel: "2026",
    authorName: "Anonymous",
    clarity: 4,
    support: 4,
    organization: 4,
    body: `Review ${id}`,
    status,
    createdAt: new Date(createdAt),
  };
}

function user(id: string, role: string, createdAt: number, name = id) {
  return {
    id,
    name,
    email: `${id}@example.com`,
    role,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
  };
}

it("lists the newest pending reviews and shows access requests only to admins", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.insert(lecturers).values({ id: "lecturer", name: "Lecturer" });
    await db.insert(courses).values({ id: "course", code: "CS", nameId: "Data", nameEn: "Data" });
    await db
      .insert(reviews)
      .values([
        ...Array.from({ length: 6 }, (_, index) =>
          review(`pending-${index}`, "pending", now - index),
        ),
        review("published", "published", now),
        { ...review("deleted", "pending", now + 1), deletedAt: new Date(now) },
      ]);
    await db
      .insert(authUser)
      .values([
        user("admin", "admin", now + 10),
        user("maintainer", "maintainer", now + 10),
        ...Array.from({ length: 6 }, (_, index) =>
          user(`applicant-${index}`, "user", now - index, `Applicant ${5 - index}`),
        ),
      ]);

    for (const role of [undefined, null, "user", "moderator"]) {
      expect(await inspectDashboardHome(db, { role })).toBeNull();
    }

    const maintainerHome = await inspectDashboardHome(db, { role: "maintainer" });
    expect(maintainerHome?.pendingReviews.total).toBe(6);
    expect(maintainerHome?.pendingReviews.rows.map((row) => row.id)).toEqual([
      "pending-0",
      "pending-1",
      "pending-2",
      "pending-3",
      "pending-4",
    ]);
    expect(maintainerHome?.accessRequests).toBeNull();

    const adminHome = await inspectDashboardHome(db, { role: "admin" });
    expect(adminHome?.accessRequests?.total).toBe(6);
    expect(adminHome?.accessRequests?.rows.map((row) => row.id)).toEqual([
      "applicant-0",
      "applicant-1",
      "applicant-2",
      "applicant-3",
      "applicant-4",
    ]);
  } finally {
    await platform.dispose();
  }
});
