import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db";
import { runServerOperation } from "@/server/server-function-error";
import { requireAdminSession } from "@/server/auth";
import { moderationPageSchema } from "../-shared/schemas";
import { moderateReviewSchema } from "../-shared/moderation";
import { rejectModerationOperation } from "./failures";
import { inspectReviews, moderateLecturerReview } from "./service";

export const loadModerationReviews = createServerFn({ method: "GET" })
  .validator(moderationPageSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      inspectReviews(createDatabase(env.DB), session.user, data.offset, data.status),
    );
    if (result.error !== null) rejectModerationOperation(result.error);
    return {
      ...result.data,
      identity: { id: session.user.id, name: session.user.name, role: session.user.role },
    };
  });

export const changeReviewVisibility = createServerFn({ method: "POST" })
  .validator(moderateReviewSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      moderateLecturerReview(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectModerationOperation(result.error);
    return result.data;
  });
