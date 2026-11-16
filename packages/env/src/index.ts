import { z } from "zod";

export function parseAuthEnvironment(input: unknown): {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
} {
  return z
    .object({
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url().refine((value) => {
        const url = new URL(value);
        return (
          url.protocol === "https:" ||
          (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))
        );
      }, "Use HTTPS except on localhost"),
      GITHUB_CLIENT_ID: z.string().min(1),
      GITHUB_CLIENT_SECRET: z.string().min(1),
    })
    .parse(input);
}

export function parseSubmissionEnvironment(input: unknown): {
  REVIEW_RATE_LIMIT_SECRET: string;
} {
  return z.object({ REVIEW_RATE_LIMIT_SECRET: z.string().min(32) }).parse(input);
}
