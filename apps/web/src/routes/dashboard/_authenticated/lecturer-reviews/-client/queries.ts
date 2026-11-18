import { queryOptions } from "@tanstack/react-query";
import type { ReviewStatus } from "../-shared/schemas";
import { loadModerationReviews } from "../-server/handler";

export const moderationReviewsQuery = (offset = 0, status: ReviewStatus = "all") =>
  queryOptions({
    queryKey: ["admin", "reviews", offset, status],
    queryFn: () => loadModerationReviews({ data: { offset, status } }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
