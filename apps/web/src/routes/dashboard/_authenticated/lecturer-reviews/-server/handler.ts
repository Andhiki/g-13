import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { runServerOperation } from "@/server/server-function-error";
import { authorize } from "@/server/auth-middleware";
import { moderationPageSchema, moderationReviewSchema } from "../-shared/schemas";
import { moderateReviewSchema } from "../-shared/moderation";
import { rejectModerationOperation } from "./failures";
import { inspectReview, inspectReviews, moderateLecturerReview } from "./service";

export const loadModerationReviews = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(moderationPageSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      inspectReviews(createDatabase(env.DB), session.user, data.offset, data.status),
    );
    if (result.error !== null) rejectModerationOperation(result.error);
    return {
      ...result.data,
      identity: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.image,
      },
    };
  });

export const loadModerationReview = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(moderationReviewSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      inspectReview(createDatabase(env.DB), session.user, data.reviewId),
    );
    if (result.error !== null) rejectModerationOperation(result.error);
    return result.data;
  });

export const changeReviewVisibility = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(moderateReviewSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      moderateLecturerReview(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectModerationOperation(result.error);
    return result.data;
  });
