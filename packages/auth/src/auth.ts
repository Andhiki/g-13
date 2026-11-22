import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { authAccount, authSession, authUser, authVerification } from "@g13/db/schema/auth";
import type { createDatabase } from "@g13/db/client";
import { isAllowlistedAdmin } from "./index";
import { consumeAuthLimit } from "./repository";

export type AuthBaseURL =
  | string
  | {
      allowedHosts: string[];
      fallback?: string;
      protocol?: "http" | "https" | "auto";
    };

export type AuthConfiguration = {
  secret: string;
  baseURL: AuthBaseURL;
  trustedOrigins?: string[];
  secureCookies?: boolean;
  githubClientId: string;
  githubClientSecret: string;
  adminEmails?: string[];
  onUserCreated?: (user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
  }) => Promise<void> | void;
};

function originForHost(host: string) {
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${local ? "http" : "https"}://${host}`;
}

function defaultTrustedOrigins(baseURL: AuthBaseURL) {
  return typeof baseURL === "string"
    ? [new URL(baseURL).origin]
    : baseURL.allowedHosts.map(originForHost);
}

function isHttpsUrl(url: string) {
  return new URL(url).protocol === "https:";
}

function defaultSecureCookies(baseURL: AuthBaseURL) {
  if (typeof baseURL === "string") return isHttpsUrl(baseURL);
  if (baseURL.protocol && baseURL.protocol !== "auto") return baseURL.protocol === "https";
  return baseURL.fallback ? isHttpsUrl(baseURL.fallback) : true;
}

export function createAuth(db: ReturnType<typeof createDatabase>, config: AuthConfiguration) {
  const adminEmails = (config.adminEmails ?? [])
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  async function promoteAllowlistedAdmin(userId: string) {
    if (adminEmails.length === 0) return;
    const [user] = await db
      .select({ email: authUser.email, role: authUser.role })
      .from(authUser)
      .where(eq(authUser.id, userId))
      .limit(1);
    if (!user || user.role === "admin" || !isAllowlistedAdmin(user.email, adminEmails)) return;
    await db.update(authUser).set({ role: "admin" }).where(eq(authUser.id, userId));
  }

  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins ?? defaultTrustedOrigins(config.baseURL),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      transaction: false,
      schema: {
        user: authUser,
        session: authSession,
        account: authAccount,
        verification: authVerification,
      },
    }),
    emailAndPassword: { enabled: false },
    socialProviders: {
      github: {
        clientId: config.githubClientId,
        clientSecret: config.githubClientSecret,
        disableSignUp: false,
      },
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "user", input: false },
      },
    },
    account: {
      accountLinking: { enabled: false },
      encryptOAuthTokens: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) =>
            isAllowlistedAdmin(user.email, adminEmails)
              ? { data: { ...user, role: "admin" } }
              : undefined,
          after: async (user) => {
            if (!config.onUserCreated) return;
            const role = "role" in user && typeof user.role === "string" ? user.role : null;
            await config.onUserCreated({
              id: user.id,
              name: user.name,
              email: user.email,
              role,
            });
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            await promoteAllowlistedAdmin(session.userId);
            return { data: { ...session, ipAddress: null, userAgent: null } };
          },
        },
        update: {
          before: async (session) => ({ data: { ...session, ipAddress: null, userAgent: null } }),
        },
      },
    },
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.secureCookies ?? defaultSecureCookies(config.baseURL),
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: { "/sign-in/social": { window: 60, max: 10 } },
      customStorage: {
        consume: (key, rule) => consumeAuthLimit(db, config.secret, key, rule),
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
