import { queryOptions } from "@tanstack/react-query";
import type { AnnouncementStatus } from "../-shared/schemas";
import { loadAdminAnnouncements } from "../-server/handler";
import {
  ADMIN_STALE_TIME,
  adminRefetchOnFocus,
} from "@/routes/dashboard/_authenticated/-client/admin-query";

export const adminAnnouncementsQuery = (
  offset = 0,
  status: AnnouncementStatus = "live",
  query = "",
) =>
  queryOptions({
    queryKey: ["admin", "announcements", offset, status, query],
    queryFn: () => loadAdminAnnouncements({ data: { offset, status, query } }),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
    retry: false,
  });
