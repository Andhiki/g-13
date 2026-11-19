import { createAuth } from "@g13/auth/server";
import { canManageUsers, canModerate } from "@g13/auth";
import { createDatabase } from "@g13/db";
import { parseAuthEnvironment } from "@g13/env";
import { env } from "cloudflare:workers";
import { dispatchNotification } from "./notifications";

export function requestAuth() {
  const config = parseAuthEnvironment(env);
  const db = createDatabase(env.DB);
  return createAuth(db, {
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    githubClientId: config.GITHUB_CLIENT_ID,
    githubClientSecret: config.GITHUB_CLIENT_SECRET,
    onUserCreated: async (user) => {
      if (user.role && user.role !== "user") return;
      try {
        await dispatchNotification(db, {
          type: "user.pending_approval",
          resourceType: "user",
          resourceId: user.id,
          actorId: user.id,
          payload: { userName: user.name, userEmail: user.email },
          dedupeKey: `user.pending_approval:${user.id}`,
          recipients: { roles: ["admin"], excludeUserIds: [user.id] },
        });
      } catch {
        // Notification delivery is non-blocking for user sign-up.
      }
    },
  });
}

export async function requireAuthenticatedSession(headers: Headers) {
  const session = await requestAuth().api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  if (!session) throw new Response("Authentication required", { status: 401 });
  return session;
}

export async function requireAdminSession(
  headers: Headers,
  permission: "moderate" | "manage-users",
) {
  const session = await requireAuthenticatedSession(headers);
  const allowed =
    permission === "manage-users"
      ? canManageUsers(session.user.role)
      : canModerate(session.user.role);
  if (!allowed) throw new Response("Access denied", { status: 403 });
  return session;
}
