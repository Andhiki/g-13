import { createAuth } from "@g13/auth/server";
import { hasPermission, type Permission } from "@g13/auth";
import { createDatabase } from "@g13/db/client";
import { parseAuthEnvironment } from "@g13/env";
import { env } from "cloudflare:workers";
import { dispatchNotification } from "./notifications";

let cachedAuth: ReturnType<typeof buildAuth> | undefined;

// Bindings and secrets are fixed for the isolate, so build Better Auth once and reuse it
// instead of paying its setup cost on every protected request.
export function requestAuth() {
  cachedAuth ??= buildAuth();
  return cachedAuth;
}

function buildAuth() {
  const config = parseAuthEnvironment(env);
  const db = createDatabase(env.DB);
  return createAuth(db, {
    secret: config.BETTER_AUTH_SECRET,
    baseURL: {
      allowedHosts: config.BETTER_AUTH_ALLOWED_HOSTS,
      fallback: config.BETTER_AUTH_URL,
      protocol: "auto",
    },
    secureCookies: new URL(config.BETTER_AUTH_URL).protocol === "https:",
    adminEmails: config.ADMIN_EMAILS,
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

export async function requireAdminSession(headers: Headers, permission: Permission) {
  const session = await requireAuthenticatedSession(headers);
  if (!hasPermission(session.user.role, permission)) {
    throw new Response("Access denied", { status: 403 });
  }
  return session;
}
