import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { loadNotifications } from "../-server/handler";
import type { NotificationCursor, NotificationFilter } from "../-shared/schemas";

const dashboardStaleTime = 5 * 60 * 1000;
const firstPage: NotificationCursor | null = null;

export const notificationReadMutationKey = ["notifications", "mark-read"];

export function notificationsQuery(filter: NotificationFilter = "all") {
  return infiniteQueryOptions({
    queryKey: ["notifications", "list", filter],
    queryFn: ({ pageParam }: { pageParam: NotificationCursor | null }) =>
      loadNotifications({ data: { cursor: pageParam, filter } }),
    initialPageParam: firstPage,
    getNextPageParam: (page) => page.nextCursor,
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
  });
}

export function notificationPopoverQuery() {
  return queryOptions({
    queryKey: ["notifications", "popover"],
    queryFn: () => loadNotifications({ data: { filter: "unread" } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
  });
}
