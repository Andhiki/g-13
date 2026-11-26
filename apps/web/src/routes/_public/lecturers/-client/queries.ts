import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import type { Language } from "@g13/i18n";
import {
  loadBrowserLikes,
  loadCoursePickerPage,
  loadLecturerDetail,
  loadLecturerDirectory,
  loadOwnPendingReviews,
  loadTurnstileSiteKey,
} from "../-server/handler";
import { pendingReviewBatchSize, type CoursePickerCursor } from "../-shared/schemas";

const publicDataStaleTime = 5 * 60 * 1000;
const firstPage: CoursePickerCursor | null = null;

export function coursePickerQueryOptions(query: string, language: Language) {
  return infiniteQueryOptions({
    queryKey: ["lecturer-reviews", "course-picker", language, query],
    queryFn: ({ pageParam }: { pageParam: CoursePickerCursor | null }) =>
      loadCoursePickerPage({ data: { cursor: pageParam, query, language } }),
    initialPageParam: firstPage,
    getNextPageParam: (page) => page.nextCursor,
    staleTime: publicDataStaleTime,
    refetchOnWindowFocus: false,
  });
}

export function turnstileSiteKeyQueryOptions() {
  return queryOptions({
    queryKey: ["turnstile", "site-key"],
    queryFn: () => loadTurnstileSiteKey(),
    staleTime: publicDataStaleTime,
    refetchOnWindowFocus: false,
  });
}

export function lecturerDirectoryQueryOptions() {
  return queryOptions({
    queryKey: ["lecturer-reviews", "directory"],
    queryFn: async () => {
      const data = await loadLecturerDirectory();
      if (!data) throw notFound();
      return data;
    },
    staleTime: publicDataStaleTime,
    refetchOnWindowFocus: false,
  });
}

export function lecturerDetailQueryOptions(lecturerId: string) {
  return queryOptions({
    queryKey: ["lecturer-reviews", "detail", lecturerId],
    queryFn: async () => {
      const data = await loadLecturerDetail({ data: { lecturerId } });
      if (!data) throw notFound();
      return data;
    },
    staleTime: publicDataStaleTime,
    refetchOnWindowFocus: false,
  });
}

export function ownPendingReviewsQueryOptions(lecturerId: string, reviewIds: string[]) {
  return queryOptions({
    queryKey: ["lecturer-reviews", "own-pending", lecturerId, reviewIds],
    queryFn: async () => {
      const batches = [];
      for (let start = 0; start < reviewIds.length; start += pendingReviewBatchSize) {
        batches.push(
          loadOwnPendingReviews({
            data: { lecturerId, reviewIds: reviewIds.slice(start, start + pendingReviewBatchSize) },
          }),
        );
      }
      return (await Promise.all(batches))
        .flat()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    enabled: reviewIds.length > 0,
  });
}

export function lecturerBrowserLikesQueryOptions(browserId: string) {
  return queryOptions({
    queryKey: ["lecturer-reviews", "likes", browserId],
    queryFn: () => loadBrowserLikes({ data: { browserId } }),
    staleTime: publicDataStaleTime,
    refetchOnWindowFocus: false,
  });
}
