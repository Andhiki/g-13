import { queryOptions } from "@tanstack/react-query";
import type { ReviewStatus } from "../-shared/schemas";
import { loadModerationReview, loadModerationReviews } from "../-server/handler";
import {
  ADMIN_STALE_TIME,
  adminRefetchOnFocus,
} from "@/routes/dashboard/_authenticated/-client/admin-query";

export const moderationReviewsQuery = (offset = 0, status: ReviewStatus = "all", query = "") =>
  queryOptions({
    queryKey: ["admin", "reviews", offset, status, query],
    queryFn: () => loadModerationReviews({ data: { offset, status, query } }),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
    retry: false,
  });

export const moderationReviewQuery = (reviewId: string) =>
  queryOptions({
    queryKey: ["admin", "review", reviewId],
    queryFn: () => loadModerationReview({ data: { reviewId } }),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
    retry: false,
  });
