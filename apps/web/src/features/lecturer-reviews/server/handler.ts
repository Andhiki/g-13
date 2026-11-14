import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db";
import { parseSubmissionEnvironment } from "@g13/env";
import { reviewClientIp } from "../../../server/request-identity";
import {
  browserLikesInputSchema,
  lecturerDetailInputSchema,
  publishReviewInputSchema,
  reviewLikeInputSchema,
  validateRpcInput,
} from "../shared/schemas";
import { getLecturerDetail, getLecturerDirectory } from "./read.service";
import { getBrowserReviewLikes } from "./repository";
import { setReviewLike } from "./likes.service";
import { submitReview } from "./submission.service";

export const loadLecturerDirectory = createServerFn({ method: "GET" }).handler(async () => {
  return getLecturerDirectory(createDatabase(env.DB));
});

export const loadLecturerDetail = createServerFn({ method: "GET" })
  .validator((input: unknown) => validateRpcInput(lecturerDetailInputSchema, input))
  .handler(async ({ data }) => {
    if (!data.valid) return null;
    return getLecturerDetail(createDatabase(env.DB), data.data.lecturerId);
  });

export const publishLecturerReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => validateRpcInput(publishReviewInputSchema, input))
  .handler(async ({ data }) => {
    if (!data.valid) return { ok: false as const, error: "invalid" as const };
    const { REVIEW_RATE_LIMIT_SECRET: secret } = parseSubmissionEnvironment(env);
    const ip = reviewClientIp(getRequest());
    return submitReview(createDatabase(env.DB), data.data, { ip, secret });
  });

export const loadBrowserLikes = createServerFn({ method: "POST" })
  .validator((input: unknown) => validateRpcInput(browserLikesInputSchema, input))
  .handler(async ({ data }) => {
    if (!data.valid) return [];
    return getBrowserReviewLikes(createDatabase(env.DB), data.data.browserId);
  });

export const updateReviewLike = createServerFn({ method: "POST" })
  .validator((input: unknown) => validateRpcInput(reviewLikeInputSchema, input))
  .handler(async ({ data }) => {
    if (!data.valid) return { ok: false as const, error: "invalid" as const };
    const { REVIEW_RATE_LIMIT_SECRET: secret } = parseSubmissionEnvironment(env);
    const ip = reviewClientIp(getRequest());
    return setReviewLike(createDatabase(env.DB), data.data, { ip, secret });
  });
