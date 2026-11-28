import { createServerFn } from "@tanstack/react-start";
import { authorize } from "@/server/auth-middleware";
import { loadAdminPage, runAdminOperation } from "../../-server/admin-handler";
import { MODERATION_ERRORS, type ModerationOperationError } from "../-shared/errors";
import { moderateReviewSchema } from "../-shared/moderation";
import { moderationPageSchema, moderationReviewSchema } from "../-shared/schemas";
import { inspectReview, inspectReviews, moderateLecturerReview } from "./service";

const moderationErrorStatuses = {
  [MODERATION_ERRORS.FORBIDDEN]: 403,
  [MODERATION_ERRORS.REVIEW_ACTION_UNAVAILABLE]: 409,
} satisfies Record<ModerationOperationError, number>;

export const loadModerationReviews = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(moderationPageSchema)
  .handler(({ data, context: { session } }) =>
    loadAdminPage(session.user, moderationErrorStatuses, (db) =>
      inspectReviews(db, session.user, data.offset, data.status, data.query),
    ),
  );

export const loadModerationReview = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(moderationReviewSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(moderationErrorStatuses, (db) =>
      inspectReview(db, session.user, data.reviewId),
    ),
  );

export const changeReviewVisibility = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(moderateReviewSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(moderationErrorStatuses, (db) =>
      moderateLecturerReview(db, session.user, data),
    ),
  );
