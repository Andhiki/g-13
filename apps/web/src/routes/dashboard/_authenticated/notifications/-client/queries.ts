import { queryOptions } from "@tanstack/react-query";
import { loadNotifications, loadUnreadNotificationCount } from "../-server/handler";
import type { NotificationFilter } from "../-shared/schemas";

export function notificationsQuery(offset = 0, filter: NotificationFilter = "all") {
  return queryOptions({
    queryKey: ["notifications", "list", offset, filter],
    queryFn: () => loadNotifications({ data: { offset, filter } }),
  });
}

export function unreadNotificationCountQuery() {
  return queryOptions({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => loadUnreadNotificationCount(),
    staleTime: 30_000,
  });
}
