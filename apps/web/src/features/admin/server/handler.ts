import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db";
import { requireAdminSession, requestAuth } from "../../../server/auth";
import { moderateReviewSchema } from "../../lecturer-reviews/shared/moderation";
import { assignRoleSchema, moderationPageSchema, userPageSchema } from "../shared/schemas";
import { approveUserRole, inspectReviews, inspectUsers, moderateLecturerReview } from "./service";

export const loadAdminIdentity = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requestAuth().api.getSession({
    headers: getRequestHeaders(),
    query: { disableCookieCache: true },
  });
  return session ? { id: session.user.id, name: session.user.name, role: session.user.role } : null;
});

export const loadModerationReviews = createServerFn({ method: "GET" })
  .validator((input: unknown) => moderationPageSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    return inspectReviews(createDatabase(env.DB), session.user, data.offset, data.status);
  });

export const changeReviewVisibility = createServerFn({ method: "POST" })
  .validator((input: unknown) => moderateReviewSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    return moderateLecturerReview(createDatabase(env.DB), session.user, data);
  });

export const loadAdminUsers = createServerFn({ method: "GET" })
  .validator((input: unknown) => userPageSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "manage-users");
    return inspectUsers(createDatabase(env.DB), session.user, data.offset, data.status);
  });

export const changeUserRole = createServerFn({ method: "POST" })
  .validator((input: unknown) => assignRoleSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "manage-users");
    return approveUserRole(createDatabase(env.DB), session.user, data);
  });
