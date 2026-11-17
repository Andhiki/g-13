import { queryOptions } from "@tanstack/react-query";
import type { ReviewStatus, UserStatus } from "../shared/schemas";
import { loadAdminUsers, loadModerationReviews } from "../server/handler";

export const moderationReviewsQuery = (offset = 0, status: ReviewStatus = "all") =>
  queryOptions({
    queryKey: ["admin", "reviews", offset, status],
    queryFn: () => loadModerationReviews({ data: { offset, status } }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

export const adminUsersQuery = (offset = 0, status: UserStatus = "all") =>
  queryOptions({
    queryKey: ["admin", "users", offset, status],
    queryFn: () => loadAdminUsers({ data: { offset, status } }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
