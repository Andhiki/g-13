import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { publishLecturerReview, updateReviewLike } from "../server/handler";
import type { ReviewSubmission } from "../shared/submission-schema";
import {
  lecturerBrowserLikesQueryOptions,
  lecturerDetailQueryOptions,
  lecturerDirectoryQueryOptions,
} from "./queries";

export function publishLecturerReviewMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: (input: ReviewSubmission) => publishLecturerReview({ data: input }),
    onSuccess: async (result, input) => {
      if (!result.ok) return;
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
    mutationFn: async (input: {
      reviewId: string;
      browserId: string;
      lecturerId: string;
      liked: boolean;
    }) => {
      const result = await updateReviewLike({
        data: { reviewId: input.reviewId, browserId: input.browserId, liked: input.liked },
      });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: async (_result, input) => {
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
