import { queryOptions } from "@tanstack/react-query";
import { loadNotifications } from "../-server/handler";
import type { NotificationFilter } from "../-shared/schemas";

const dashboardStaleTime = 5 * 60 * 1000;

export function notificationsQuery(offset = 0, filter: NotificationFilter = "all") {
  return queryOptions({
    queryKey: ["notifications", "list", offset, filter],
    queryFn: () => loadNotifications({ data: { offset, filter } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
  });
}
