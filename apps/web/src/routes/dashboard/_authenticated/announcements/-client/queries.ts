import { queryOptions } from "@tanstack/react-query";
import type { AnnouncementStatus } from "../-shared/schemas";
import { loadAdminAnnouncements } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminAnnouncementsQuery = (offset = 0, status: AnnouncementStatus = "live") =>
  queryOptions({
    queryKey: ["admin", "announcements", offset, status],
    queryFn: () => loadAdminAnnouncements({ data: { offset, status } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });

export const adminAnnouncementsQueryKey = ["admin", "announcements"] as const;
