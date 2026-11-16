import { canManageUsers, canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db";
import type { ModerateReviewInput } from "../../lecturer-reviews/shared/moderation";
import { moderateReview } from "../../lecturer-reviews/server/repository";
import type { AssignRoleInput, ReviewStatus, UserStatus } from "../shared/schemas";
import {
  assignUserRole,
  getModerationCounts,
  getUserCounts,
  listAdminUsers,
  listModerationReviews,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };

export async function inspectReviews(
  db: Database,
  actor: Actor,
  offset = 0,
  status: ReviewStatus = "all",
) {
  if (!canModerate(actor.role)) throw new Error("Access denied");
  const [rows, counts] = await Promise.all([
    listModerationReviews(db, offset, status),
    getModerationCounts(db),
  ]);
  return { rows, counts };
}

export async function moderateLecturerReview(
  db: Database,
  actor: Actor,
  input: ModerateReviewInput,
) {
  if (!canModerate(actor.role)) throw new Error("Access denied");
  return { ok: await moderateReview(db, input) };
}

export async function inspectUsers(
  db: Database,
  actor: Actor,
  offset = 0,
  status: UserStatus = "all",
) {
  if (!canManageUsers(actor.role)) throw new Error("Access denied");
  const [rows, counts] = await Promise.all([listAdminUsers(db, offset, status), getUserCounts(db)]);
  return { rows, counts };
}

export async function approveUserRole(db: Database, actor: Actor, input: AssignRoleInput) {
  if (!canManageUsers(actor.role) || input.userId === actor.id) throw new Error("Access denied");
  return { ok: await assignUserRole(db, input) };
}
