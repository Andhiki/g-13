import { authAccount, authRateLimits, authSession, authUser, authVerification } from "./auth";
import { courses } from "./courses";
import { lecturers } from "./lecturers";
import { reviewLikes, reviewSubmissionLimits, reviews } from "./lecturer-reviews";
import {
  notificationEvents,
  notifications,
  type NotificationPayload,
  type NotificationPayloadValue,
} from "./notifications";

export {
  courses,
  lecturers,
  reviewLikes,
  reviewSubmissionLimits,
  reviews,
  authUser,
  authSession,
  authAccount,
  authVerification,
  authRateLimits,
  notificationEvents,
  notifications,
  type NotificationPayload,
  type NotificationPayloadValue,
};

export const schema = {
  lecturers,
  courses,
  reviews,
  reviewLikes,
  reviewSubmissionLimits,
  authUser,
  authSession,
  authAccount,
  authVerification,
  authRateLimits,
  notificationEvents,
  notifications,
};
