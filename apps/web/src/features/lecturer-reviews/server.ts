import { createServerFn } from "@tanstack/react-start";

export const loadLecturerDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const [{ env }, { createDatabase }, { getLecturerDirectory }] = await Promise.all([
    import("cloudflare:workers"),
    import("@g13/db"),
    import("./repository"),
  ]);
  const database = createDatabase(env.DB);
  return getLecturerDirectory(database);
});

export const loadLecturerDetail = createServerFn({ method: "GET" })
  .validator((input: { lecturerId: string }) => input)
  .handler(async ({ data }) => {
    const [{ env }, { createDatabase }, { getLecturerDetail }] = await Promise.all([
      import("cloudflare:workers"),
      import("@g13/db"),
      import("./repository"),
    ]);
    return getLecturerDetail(createDatabase(env.DB), data.lecturerId);
  });

export const publishLecturerReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    const [
      { env },
      { getRequest },
      { parseSubmissionEnvironment },
      { createDatabase },
      { submitReview },
    ] = await Promise.all([
      import("cloudflare:workers"),
      import("@tanstack/react-start/server"),
      import("@g13/env"),
      import("@g13/db"),
      import("./submission"),
    ]);
    const secret = parseSubmissionEnvironment(
      env as unknown as Record<string, unknown>,
    ).REVIEW_RATE_LIMIT_SECRET;
    // Cloudflare overwrites this header. Local development uses the loopback identity.
    const request = getRequest();
    const host = new URL(request.url).hostname;
    const ip =
      request.headers.get("cf-connecting-ip") ??
      (["localhost", "127.0.0.1"].includes(host) ? "127.0.0.1" : null);
    return submitReview(createDatabase(env.DB), data, { ip, secret });
  });

export const loadBrowserLikes = createServerFn({ method: "POST" })
  .validator((input: { browserId: string }) => input)
  .handler(async ({ data }) => {
    const [{ env }, { createDatabase }, { getBrowserLikes }] = await Promise.all([
      import("cloudflare:workers"),
      import("@g13/db"),
      import("./likes"),
    ]);
    return getBrowserLikes(createDatabase(env.DB), data?.browserId);
  });

export const updateReviewLike = createServerFn({ method: "POST" })
  .validator((input: { reviewId: string; browserId: string; liked: boolean }) => input)
  .handler(async ({ data }) => {
    const [
      { env },
      { getRequest },
      { parseSubmissionEnvironment },
      { createDatabase },
      { setReviewLike },
    ] = await Promise.all([
      import("cloudflare:workers"),
      import("@tanstack/react-start/server"),
      import("@g13/env"),
      import("@g13/db"),
      import("./likes"),
    ]);
    const secret = parseSubmissionEnvironment(
      env as unknown as Record<string, unknown>,
    ).REVIEW_RATE_LIMIT_SECRET;
    const request = getRequest();
    const host = new URL(request.url).hostname;
    const ip =
      request.headers.get("cf-connecting-ip") ??
      (["localhost", "127.0.0.1"].includes(host) ? "127.0.0.1" : null);
    return setReviewLike(createDatabase(env.DB), data, { ip, secret });
  });
