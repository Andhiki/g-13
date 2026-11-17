import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db";
import { parseSubmissionEnvironment } from "@g13/env";
import { reviewClientIp } from "@/server/request-identity";
import { runServerOperation } from "@/server/server-function-error";
import {
  browserLikesInputSchema,
  lecturerDetailInputSchema,
  publishReviewInputSchema,
  reviewLikeInputSchema,
} from "../-shared/schemas";
import { getLecturerDetail, getLecturerDirectory } from "./read.service";
import { getBrowserReviewLikes } from "./repository";
import { rejectReviewLikeOperation, rejectSubmissionOperation } from "./failures";
import { setReviewLike } from "./likes.service";
import { submitReview } from "./submission.service";

export const loadLecturerDirectory = createServerFn({ method: "GET" }).handler(async () =>
  runServerOperation(() => getLecturerDirectory(createDatabase(env.DB))),
);

export const loadLecturerDetail = createServerFn({ method: "GET" })
  .validator(lecturerDetailInputSchema)
  .handler(async ({ data }) =>
    runServerOperation(() => getLecturerDetail(createDatabase(env.DB), data.lecturerId)),
  );

export const publishLecturerReview = createServerFn({ method: "POST" })
  .validator(publishReviewInputSchema)
  .handler(async ({ data }) => {
    const result = await runServerOperation(async () => {
      const { REVIEW_RATE_LIMIT_SECRET: secret } = parseSubmissionEnvironment(env);
      const ip = reviewClientIp(getRequest());
      return submitReview(createDatabase(env.DB), data, { ip, secret });
    });
    if (result.error !== null) return rejectSubmissionOperation(result.error);
    return result.data;
  });

export const loadBrowserLikes = createServerFn({ method: "POST" })
  .validator(browserLikesInputSchema)
  .handler(async ({ data }) =>
    runServerOperation(() => getBrowserReviewLikes(createDatabase(env.DB), data.browserId)),
  );

export const updateReviewLike = createServerFn({ method: "POST" })
  .validator(reviewLikeInputSchema)
  .handler(async ({ data }) => {
    const result = await runServerOperation(async () => {
      const { REVIEW_RATE_LIMIT_SECRET: secret } = parseSubmissionEnvironment(env);
      const ip = reviewClientIp(getRequest());
      return setReviewLike(createDatabase(env.DB), data, { ip, secret });
    });
    if (result.error !== null) return rejectReviewLikeOperation(result.error);
    return result.data;
  });
