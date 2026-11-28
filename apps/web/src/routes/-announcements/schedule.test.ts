import { and, eq, type SQL } from "drizzle-orm";
import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { announcements } from "@g13/db/schema/announcements";
import { authUser } from "@g13/db/schema/auth";
import { createTestPlatformProxy } from "@/test/database";
import {
  announcementActiveAtCondition,
  announcementStatusCondition,
  announcementStatuses,
  isAnnouncementWindowActive,
  resolveAnnouncementStatus,
} from "./schedule";

const t = 1_800_000_000_000;
const windows = [
  { startsAt: t, endsAt: t + 1000 },
  { startsAt: t, endsAt: null },
];
// Either side of the start, exactly at it, inside, exactly at the end, and after.
const instants = [t - 1, t, t + 1, t + 999, t + 1000, t + 1001];

it("the TypeScript and SQL schedule rules agree at every boundary", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const now = new Date();
    await db.insert(authUser).values({
      id: "author",
      name: "Author",
      email: "author@example.com",
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });
    const rows = windows.flatMap((window, index) =>
      [true, false].map((enabled) => ({
        id: `${index}-${enabled}`,
        titleId: "Judul",
        titleEn: "Title",
        bodyId: "Isi",
        bodyEn: "Body",
        createdById: "author",
        enabled,
        startsAt: new Date(window.startsAt),
        endsAt: window.endsAt === null ? null : new Date(window.endsAt),
      })),
    );
    await db.insert(announcements).values(rows);

    for (const at of instants) {
      for (const row of rows) {
        const matches = async (condition: SQL) =>
          (
            await db
              .select({ id: announcements.id })
              .from(announcements)
              .where(and(eq(announcements.id, row.id), condition))
          ).length === 1;
        const label = `${row.id} at t${at >= t ? "+" : ""}${at - t}`;

        expect(await matches(announcementActiveAtCondition(at)), label).toBe(
          isAnnouncementWindowActive(row.startsAt.getTime(), row.endsAt?.getTime() ?? null, at),
        );

        const inStatus = await Promise.all(
          announcementStatuses.map((status) => matches(announcementStatusCondition(status, at))),
        );
        const sqlStatuses = announcementStatuses.filter((_, index) => inStatus[index]);
        // Every row is in exactly one status, the same one in both forms.
        expect(sqlStatuses, label).toEqual([resolveAnnouncementStatus(row, at)]);
      }
    }
  } finally {
    await platform.dispose();
  }
}, 30_000);
