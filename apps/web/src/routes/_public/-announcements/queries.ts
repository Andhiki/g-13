import { queryOptions } from "@tanstack/react-query";
import { loadActiveAnnouncements } from "./handler";

const bannerStaleTime = 5 * 60 * 1000;

export const activeAnnouncementsQuery = () =>
  queryOptions({
    queryKey: ["announcements", "active"],
    queryFn: () => loadActiveAnnouncements(),
    staleTime: bannerStaleTime,
    refetchOnWindowFocus: false,
  });
