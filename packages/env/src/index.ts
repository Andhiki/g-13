import { z } from "zod";

export const featureFlagNames = ["professorReviews"] as const;
export type FeatureFlag = (typeof featureFlagNames)[number];
export type FeatureFlags = Record<FeatureFlag, boolean>;
export type RuntimeEnvironment = { features: FeatureFlags };

const runtimeEnvironmentSchema = z.object({
  PROFESSOR_REVIEWS_ENABLED: z.enum(["true", "false"]).default("false"),
});

export function parseRuntimeEnvironment(input: Record<string, unknown>): RuntimeEnvironment {
  const environment = runtimeEnvironmentSchema.parse(input);
  return {
    features: { professorReviews: environment.PROFESSOR_REVIEWS_ENABLED === "true" },
  };
}

export function isFeatureEnabled(flags: FeatureFlags, flag: FeatureFlag): boolean {
  return flags[flag];
}

export function parseSubmissionEnvironment(input: Record<string, unknown>): {
  REVIEW_RATE_LIMIT_SECRET: string;
} {
  return z.object({ REVIEW_RATE_LIMIT_SECRET: z.string().min(32) }).parse(input);
}
