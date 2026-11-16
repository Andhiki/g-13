import { createAuth } from "@g13/auth/server";
import { canManageUsers, canModerate } from "@g13/auth";
import { createDatabase } from "@g13/db";
import { parseAuthEnvironment } from "@g13/env";
import { env } from "cloudflare:workers";

export function requestAuth() {
  const config = parseAuthEnvironment(env);
  return createAuth(createDatabase(env.DB), {
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    githubClientId: config.GITHUB_CLIENT_ID,
    githubClientSecret: config.GITHUB_CLIENT_SECRET,
  });
}

export async function requireAdminSession(
  headers: Headers,
  permission: "moderate" | "manage-users",
) {
  const session = await requestAuth().api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  if (!session) throw new Response("Authentication required", { status: 401 });
  const allowed =
    permission === "manage-users"
      ? canManageUsers(session.user.role)
      : canModerate(session.user.role);
  if (!allowed) throw new Response("Access denied", { status: 403 });
  return session;
}
