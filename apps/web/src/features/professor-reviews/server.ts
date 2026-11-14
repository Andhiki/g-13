import { createServerFn } from "@tanstack/react-start";

export async function readProfessorReviewsWhenEnabled<T>(
  enabled: boolean,
  read: () => Promise<T>,
): Promise<T | null> {
  return enabled ? read() : null;
}

export const loadProfessorReviews = createServerFn({ method: "GET" }).handler(async () => {
  const [{ env }, { parseRuntimeEnvironment }, { createDatabase }, { getPublicProfessorReviews }] =
    await Promise.all([
      import("cloudflare:workers"),
      import("@g13/env"),
      import("@g13/db"),
      import("./repository"),
    ]);
  const configuration = parseRuntimeEnvironment({
    PROFESSOR_REVIEWS_ENABLED: env.PROFESSOR_REVIEWS_ENABLED,
  });
  return readProfessorReviewsWhenEnabled(configuration.features.professorReviews, async () => {
    const database = createDatabase(env.DB);
    return getPublicProfessorReviews(database);
  });
});
