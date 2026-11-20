import { queryOptions } from "@tanstack/react-query";
import type { ReviewStatus } from "../-shared/schemas";
import { loadModerationReview, loadModerationReviews } from "../-server/handler";

export const moderationReviewsQuery = (offset = 0, status: ReviewStatus = "all") =>
  queryOptions({
    queryKey: ["admin", "reviews", offset, status],
    queryFn: () => loadModerationReviews({ data: { offset, status } }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

export const moderationReviewQuery = (reviewId: string) =>
  queryOptions({
    queryKey: ["admin", "review", reviewId],
    queryFn: () => loadModerationReview({ data: { reviewId } }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
