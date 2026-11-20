import { z } from "zod";

const hostPattern =
  /^(?:\*\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*(?::\d{2,5})?$/i;

const authEnvironmentSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))
    );
  }, "Use HTTPS except on localhost"),
  BETTER_AUTH_ALLOWED_HOSTS: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

export type AuthEnvironment = {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_ALLOWED_HOSTS: string[];
  ADMIN_EMAILS: string[];
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};

export function parseAuthEnvironment(input: unknown): AuthEnvironment {
  const parsed = authEnvironmentSchema.parse(input);
  const configuredHosts = (parsed.BETTER_AUTH_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const allowedHosts =
    configuredHosts.length > 0 ? configuredHosts : [new URL(parsed.BETTER_AUTH_URL).host];
  const invalidHosts = allowedHosts.filter((host) => !hostPattern.test(host));
  if (invalidHosts.length > 0) {
    throw new Error(`Invalid BETTER_AUTH_ALLOWED_HOSTS entry: ${invalidHosts.join(", ")}`);
  }
  const adminEmails = (parsed.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const invalidEmails = adminEmails.filter((email) => !z.email().safeParse(email).success);
  if (invalidEmails.length > 0) {
    throw new Error(`Invalid ADMIN_EMAILS entry: ${invalidEmails.join(", ")}`);
  }
  return {
    BETTER_AUTH_SECRET: parsed.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: parsed.BETTER_AUTH_URL,
    BETTER_AUTH_ALLOWED_HOSTS: allowedHosts,
    ADMIN_EMAILS: adminEmails,
    GITHUB_CLIENT_ID: parsed.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: parsed.GITHUB_CLIENT_SECRET,
  };
}

export function parseSubmissionEnvironment(input: unknown): {
  REVIEW_RATE_LIMIT_SECRET: string;
} {
  return z.object({ REVIEW_RATE_LIMIT_SECRET: z.string().min(32) }).parse(input);
}
