import { queryOptions } from "@tanstack/react-query";
import type { AnnouncementStatus } from "../-shared/schemas";
import { loadAdminAnnouncements } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminAnnouncementsQuery = (
  offset = 0,
  status: AnnouncementStatus = "live",
  query = "",
) =>
  queryOptions({
    queryKey: ["admin", "announcements", offset, status, query],
    queryFn: () => loadAdminAnnouncements({ data: { offset, status, query } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
