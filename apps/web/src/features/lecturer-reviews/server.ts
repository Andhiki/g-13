import { createServerFn } from "@tanstack/react-start";

export async function readLecturerReviewsWhenEnabled<T>(
  enabled: boolean,
  read: () => Promise<T>,
): Promise<T | null> {
  return enabled ? read() : null;
}

export const loadLecturerDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const [{ env }, { parseRuntimeEnvironment }, { createDatabase }, { getLecturerDirectory }] =
    await Promise.all([
      import("cloudflare:workers"),
      import("@g13/env"),
      import("@g13/db"),
      import("./repository"),
    ]);
  const configuration = parseRuntimeEnvironment({
    LECTURER_REVIEWS_ENABLED: env.LECTURER_REVIEWS_ENABLED,
  });
  return readLecturerReviewsWhenEnabled(configuration.features.lecturerReviews, async () => {
    const database = createDatabase(env.DB);
    return getLecturerDirectory(database);
  });
});

export const loadLecturerDetail = createServerFn({ method: "GET" })
  .validator((input: { lecturerId: string }) => input)
  .handler(async ({ data }) => {
    const [{ env }, { parseRuntimeEnvironment }, { createDatabase }, { getLecturerDetail }] =
      await Promise.all([
        import("cloudflare:workers"),
        import("@g13/env"),
        import("@g13/db"),
        import("./repository"),
      ]);
    if (
      !parseRuntimeEnvironment({ LECTURER_REVIEWS_ENABLED: env.LECTURER_REVIEWS_ENABLED }).features
        .lecturerReviews
    )
      return null;
    return getLecturerDetail(createDatabase(env.DB), data.lecturerId);
  });

export const publishLecturerReview = createServerFn({ method: "POST" })
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
      LECTURER_REVIEWS_ENABLED: env.LECTURER_REVIEWS_ENABLED,
    }).features.lecturerReviews;
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

export const loadBrowserLikes = createServerFn({ method: "POST" })
  .validator((input: { browserId: string }) => input)
  .handler(async ({ data }) => {
    const [{ env }, { parseRuntimeEnvironment }, { createDatabase }, { getBrowserLikes }] =
      await Promise.all([
        import("cloudflare:workers"),
        import("@g13/env"),
        import("@g13/db"),
        import("./likes"),
      ]);
    if (
      !parseRuntimeEnvironment({ LECTURER_REVIEWS_ENABLED: env.LECTURER_REVIEWS_ENABLED }).features
        .lecturerReviews
    )
      return [];
    return getBrowserLikes(createDatabase(env.DB), data?.browserId);
  });

export const updateReviewLike = createServerFn({ method: "POST" })
  .validator((input: { reviewId: string; browserId: string; liked: boolean }) => input)
  .handler(async ({ data }) => {
    const [
      { env },
      { getRequest },
      { parseRuntimeEnvironment, parseSubmissionEnvironment },
      { createDatabase },
      { setReviewLike },
    ] = await Promise.all([
      import("cloudflare:workers"),
      import("@tanstack/react-start/server"),
      import("@g13/env"),
      import("@g13/db"),
      import("./likes"),
    ]);
    const enabled = parseRuntimeEnvironment({
      LECTURER_REVIEWS_ENABLED: env.LECTURER_REVIEWS_ENABLED,
    }).features.lecturerReviews;
    if (!enabled) return { ok: false as const, error: "unavailable" as const };
    const secret = parseSubmissionEnvironment(
      env as unknown as Record<string, unknown>,
    ).REVIEW_RATE_LIMIT_SECRET;
    const request = getRequest();
    const host = new URL(request.url).hostname;
    const ip =
      request.headers.get("cf-connecting-ip") ??
      (["localhost", "127.0.0.1"].includes(host) ? "127.0.0.1" : null);
    return setReviewLike(createDatabase(env.DB), data, { enabled, ip, secret });
  });
