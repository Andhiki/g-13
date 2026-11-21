import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import type { Language } from "@g13/i18n";
import {
  loadBrowserLikes,
  loadCoursePickerPage,
  loadLecturerDetail,
  loadLecturerDirectory,
  loadTurnstileSiteKey,
} from "../-server/handler";
import type { CoursePickerCursor } from "../-shared/schemas";

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

export function lecturerBrowserLikesQueryOptions(browserId: string) {
  return queryOptions({
    queryKey: ["lecturer-reviews", "likes", browserId],
    queryFn: () => loadBrowserLikes({ data: { browserId } }),
    staleTime: publicDataStaleTime,
    refetchOnWindowFocus: false,
  });
}
