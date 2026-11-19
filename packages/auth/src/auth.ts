import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { authAccount, authSession, authUser, authVerification, type createDatabase } from "@g13/db";
import { consumeAuthLimit } from "./repository";

export type AuthConfiguration = {
  secret: string;
  baseURL: string;
  githubClientId: string;
  githubClientSecret: string;
  onUserCreated?: (user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
  }) => Promise<void> | void;
};

export function createAuth(db: ReturnType<typeof createDatabase>, config: AuthConfiguration) {
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: [new URL(config.baseURL).origin],
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
          before: async (session) => ({ data: { ...session, ipAddress: null, userAgent: null } }),
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
        secure: new URL(config.baseURL).protocol === "https:",
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
