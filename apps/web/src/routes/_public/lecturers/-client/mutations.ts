import { mutationOptions, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import {
  publishLecturerReview,
  updateReviewLike,
  type loadLecturerReviewsPage,
} from "../-server/handler";
import type { ReviewSubmissionInput } from "../-shared/submission-schema";
import {
  lecturerBrowserLikesQueryOptions,
  lecturerDetailQueryOptions,
  lecturerDirectoryQueryOptions,
  lecturerReviewsKey,
} from "./queries";

type ReviewPages = InfiniteData<Awaited<ReturnType<typeof loadLecturerReviewsPage>>>;

export type SubmittedReview = Awaited<ReturnType<typeof publishLecturerReview>>;

export function publishLecturerReviewMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: (
      input: ReviewSubmissionInput & { turnstileToken: string; browserId: string | null },
    ) => publishLecturerReview({ data: input }),
    onSuccess: async (result, input) => {
      if (result.status === "pending") return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: lecturerDirectoryQueryOptions().queryKey,
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: lecturerDetailQueryOptions(input.lecturerId).queryKey,
          exact: true,
        }),
        queryClient.invalidateQueries({ queryKey: lecturerReviewsKey(input.lecturerId) }),
      ]);
    },
  });
}

export function updateReviewLikeMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: (input: {
      reviewId: string;
      browserId: string;
      lecturerId: string;
      liked: boolean;
    }) =>
      updateReviewLike({
        data: { reviewId: input.reviewId, browserId: input.browserId, liked: input.liked },
      }),
    onSuccess: async (result, input) => {
      const likesKey = lecturerBrowserLikesQueryOptions(input.browserId).queryKey;
      const reviewsKey = lecturerReviewsKey(input.lecturerId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: likesKey, exact: true }),
        queryClient.cancelQueries({ queryKey: reviewsKey }),
      ]);
      queryClient.setQueriesData<ReviewPages>(
        { queryKey: reviewsKey },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              reviews: page.reviews.map((review) =>
                review.id === result.reviewId ? { ...review, likeCount: result.likeCount } : review,
              ),
            })),
          },
      );
      queryClient.setQueryData(likesKey, (data) => {
        const ids = data?.filter((id) => id !== result.reviewId) ?? [];
        return result.liked ? [...ids, result.reviewId] : ids;
      });
    },
  });
}
