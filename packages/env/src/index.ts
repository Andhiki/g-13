import { z } from "zod";

export function parseSubmissionEnvironment(input: unknown): {
  REVIEW_RATE_LIMIT_SECRET: string;
} {
  return z.object({ REVIEW_RATE_LIMIT_SECRET: z.string().min(32) }).parse(input);
}
