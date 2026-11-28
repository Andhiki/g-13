import { queryOptions } from "@tanstack/react-query";
import type { ReviewStatus } from "../-shared/schemas";
import { loadModerationReview, loadModerationReviews } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const moderationReviewsQuery = (offset = 0, status: ReviewStatus = "all", query = "") =>
  queryOptions({
    queryKey: ["admin", "reviews", offset, status, query],
    queryFn: () => loadModerationReviews({ data: { offset, status, query } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });

export const moderationReviewQuery = (reviewId: string) =>
  queryOptions({
    queryKey: ["admin", "review", reviewId],
    queryFn: () => loadModerationReview({ data: { reviewId } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
