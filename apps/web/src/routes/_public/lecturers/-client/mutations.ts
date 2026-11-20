import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { publishLecturerReview, updateReviewLike } from "../-server/handler";
import type { ReviewSubmissionInput } from "../-shared/submission-schema";
import {
  lecturerBrowserLikesQueryOptions,
  lecturerDetailQueryOptions,
  lecturerDirectoryQueryOptions,
} from "./queries";

export function publishLecturerReviewMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: (input: ReviewSubmissionInput) => publishLecturerReview({ data: input }),
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: lecturerDirectoryQueryOptions().queryKey,
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: lecturerDetailQueryOptions(input.lecturerId).queryKey,
          exact: true,
        }),
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
    onMutate: async (input) => {
      const detailKey = lecturerDetailQueryOptions(input.lecturerId).queryKey;
      const likesKey = lecturerBrowserLikesQueryOptions(input.browserId).queryKey;
      await Promise.all([
        queryClient.cancelQueries({ queryKey: detailKey, exact: true }),
        queryClient.cancelQueries({ queryKey: likesKey, exact: true }),
      ]);
      const detail = queryClient.getQueryData(detailKey);
      const likes = queryClient.getQueryData(likesKey);
      const wasLiked = likes?.includes(input.reviewId) ?? false;
      queryClient.setQueryData(detailKey, (data) =>
        data
          ? {
              ...data,
              reviews: data.reviews.map((review) =>
                review.id === input.reviewId
                  ? {
                      ...review,
                      likeCount: review.likeCount + Number(input.liked) - Number(wasLiked),
                    }
                  : review,
              ),
            }
          : data,
      );
      queryClient.setQueryData(likesKey, (data) =>
        data
          ? input.liked
            ? [...data.filter((id) => id !== input.reviewId), input.reviewId]
            : data.filter((id) => id !== input.reviewId)
          : data,
      );
      return { detail, likes };
    },
    onError: (_error, input, snapshot) => {
      if (!snapshot) return;
      queryClient.setQueryData(
        lecturerDetailQueryOptions(input.lecturerId).queryKey,
        snapshot.detail,
      );
      queryClient.setQueryData(
        lecturerBrowserLikesQueryOptions(input.browserId).queryKey,
        snapshot.likes,
      );
    },
    onSettled: async (_result, _error, input) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: lecturerDetailQueryOptions(input.lecturerId).queryKey,
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: lecturerBrowserLikesQueryOptions(input.browserId).queryKey,
          exact: true,
        }),
      ]);
    },
  });
}
