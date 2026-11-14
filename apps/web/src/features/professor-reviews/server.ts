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

export const publishProfessorReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    const [
      { env },
      { getRequest },
      { parseRuntimeEnvironment, parseSubmissionEnvironment },
      { createDatabase },
      { submitReview },
    ] = await Promise.all([
      import("cloudflare:workers"),
      import("@tanstack/react-start/server"),
      import("@g13/env"),
      import("@g13/db"),
      import("./submission"),
    ]);
    const enabled = parseRuntimeEnvironment({
      PROFESSOR_REVIEWS_ENABLED: env.PROFESSOR_REVIEWS_ENABLED,
    }).features.professorReviews;
    if (!enabled) return { ok: false as const, error: "unavailable" as const };
    const secret = parseSubmissionEnvironment(
      env as unknown as Record<string, unknown>,
    ).REVIEW_RATE_LIMIT_SECRET;
    // Cloudflare overwrites this header. Local development uses the loopback identity.
    const request = getRequest();
    const host = new URL(request.url).hostname;
    const ip =
      request.headers.get("cf-connecting-ip") ??
      (["localhost", "127.0.0.1"].includes(host) ? "127.0.0.1" : null);
    return submitReview(createDatabase(env.DB), data, { enabled, ip, secret });
  });
