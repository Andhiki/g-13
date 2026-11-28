import { sql } from "drizzle-orm";
import { canManageUsers, canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import {
  countModerationReviews,
  moderationStatusCondition,
  selectModerationReviews,
} from "../../lecturer-reviews/-server/repository";
import { getUserCounts, listNewestPendingUsers } from "../../users/-server/repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { role?: string | null };

const queuePreviewSize = 5;

async function inspectAccessRequests(db: Database) {
  const [rows, counts] = await Promise.all([
    listNewestPendingUsers(db, queuePreviewSize),
    getUserCounts(db),
  ]);
  return { rows, total: counts?.pending ?? 0 };
}

export async function inspectDashboardHome(db: Database, actor: Actor) {
  if (!canModerate(actor.role)) return null;
  const pending = moderationStatusCondition("pending");
  const [reviews, reviewCount, accessRequests] = await Promise.all([
    selectModerationReviews(db, pending, { limit: queuePreviewSize, offset: 0 }),
    countModerationReviews(db, { total: sql<number>`count(*)` }, pending),
    canManageUsers(actor.role) ? inspectAccessRequests(db) : null,
  ]);
  return {
    pendingReviews: { rows: reviews, total: reviewCount?.total ?? 0 },
    accessRequests,
  };
}
