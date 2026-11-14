import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { loadBrowserLikes, loadLecturerDetail, loadLecturerDirectory } from "../server/handler";

const publicDataStaleTime = 5 * 60 * 1000;

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
