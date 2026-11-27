import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { parseSubmissionEnvironment } from "@g13/env";
import { reviewClientIp } from "@/server/request-identity";
import { runServerOperation } from "@/server/server-function-error";
import {
  browserLikesInputSchema,
  coursePickerInputSchema,
  lecturerDetailInputSchema,
  lecturerReviewsInputSchema,
  ownPendingReviewsInputSchema,
  publishReviewInputSchema,
  reviewLikeInputSchema,
} from "../-shared/schemas";
import { getLecturerDetail, getLecturerDirectory, getLecturerReviewsPage } from "./read.service";
import { getBrowserReviewLikes, getCoursePickerPage, getOwnPendingReviews } from "./repository";
import {
  rejectRateLimitedReview,
  rejectReviewLikeOperation,
  rejectSubmissionOperation,
} from "./failures";
import { REVIEW_ERRORS } from "../-shared/errors";
import { setReviewLike } from "./likes.service";
import { submitReview, submitReviewAfterCaptcha } from "./submission.service";
import { verifyTurnstileToken } from "./turnstile";
import { hasReviewContactDetails, type ReviewScreeningInput } from "./review-moderation";

export const loadLecturerDirectory = createServerFn({ method: "GET" }).handler(async () =>
  runServerOperation(() => getLecturerDirectory(createDatabase(env.DB))),
);

export const loadLecturerDetail = createServerFn({ method: "GET" })
  .validator(lecturerDetailInputSchema)
  .handler(async ({ data }) =>
    runServerOperation(() => getLecturerDetail(createDatabase(env.DB), data.lecturerId)),
  );

export const loadLecturerReviewsPage = createServerFn({ method: "GET" })
  .validator(lecturerReviewsInputSchema)
  .handler(async ({ data }) =>
    runServerOperation(() => getLecturerReviewsPage(createDatabase(env.DB), data)),
  );

export const loadCoursePickerPage = createServerFn({ method: "GET" })
  .validator(coursePickerInputSchema)
  .handler(async ({ data }) =>
    runServerOperation(() => getCoursePickerPage(createDatabase(env.DB), data)),
  );

export const loadTurnstileSiteKey = createServerFn({ method: "GET" }).handler(async () =>
  runServerOperation(async () => {
    const { TURNSTILE_SITE_KEY: siteKey } = parseSubmissionEnvironment(env);
    return { siteKey };
  }),
);

export const publishLecturerReview = createServerFn({ method: "POST" })
  .validator(publishReviewInputSchema)
  .handler(async ({ data }) => {
    const result = await runServerOperation(async () => {
      const {
        REVIEW_RATE_LIMIT_SECRET: secret,
        TURNSTILE_SECRET_KEY: turnstileSecret,
        OPENAI_API_KEY: openAiApiKey,
      } = parseSubmissionEnvironment(env);
      const ip = reviewClientIp(getRequest());
      const { turnstileToken, browserId, ...review } = data;
      const verified = await verifyTurnstileToken({
        secret: turnstileSecret,
        token: turnstileToken,
        remoteip: ip,
      });
      return submitReviewAfterCaptcha(verified, () => {
        const classify =
          env.REVIEW_CLASSIFICATION_TEST_MODE === "clear"
            ? async (screening: ReviewScreeningInput) =>
                hasReviewContactDetails(screening) ? ("flagged" as const) : ("clear" as const)
            : undefined;
        return submitReview(createDatabase(env.DB), review, {
          ip,
          browserId,
          secret,
          openAiApiKey,
          classify,
        });
      });
    });
    if (result.error === REVIEW_ERRORS.RATE_LIMIT) return rejectRateLimitedReview(result.resetAt);
    if (result.error !== null) return rejectSubmissionOperation(result.error);
    return result.data;
  });

export const loadOwnPendingReviews = createServerFn({ method: "POST" })
  .validator(ownPendingReviewsInputSchema)
  .handler(async ({ data }) =>
    runServerOperation(() =>
      getOwnPendingReviews(createDatabase(env.DB), data.lecturerId, data.reviewIds),
    ),
  );

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
    if (result.error === REVIEW_ERRORS.RATE_LIMIT) return rejectRateLimitedReview(result.resetAt);
    if (result.error !== null) return rejectReviewLikeOperation(result.error);
    return result.data;
  });
