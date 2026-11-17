import { authAccount, authRateLimits, authSession, authUser, authVerification } from "./auth";
import { courses } from "./courses";
import { lecturers } from "./lecturers";
import { reviewLikes, reviewSubmissionLimits, reviews } from "./lecturer-reviews";

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
};
