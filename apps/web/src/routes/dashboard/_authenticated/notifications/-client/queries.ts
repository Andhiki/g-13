import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { loadNotifications } from "../-server/handler";
import type { NotificationCursor, NotificationFilter } from "../-shared/schemas";
import {
  ADMIN_STALE_TIME,
  adminRefetchOnFocus,
} from "@/routes/dashboard/_authenticated/-client/admin-query";

const firstPage: NotificationCursor | null = null;

export const notificationReadMutationKey = ["notifications", "mark-read"];
export const notificationArchiveMutationKey = ["notifications", "archive"];

export function notificationsQuery(filter: NotificationFilter = "all") {
  return infiniteQueryOptions({
    queryKey: ["notifications", "list", filter],
    queryFn: ({ pageParam }: { pageParam: NotificationCursor | null }) =>
      loadNotifications({ data: { cursor: pageParam, filter } }),
    initialPageParam: firstPage,
    getNextPageParam: (page) => page.nextCursor,
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
  });
}

export function notificationPopoverQuery() {
  return queryOptions({
    queryKey: ["notifications", "popover"],
    queryFn: () => loadNotifications({ data: { filter: "unread" } }),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
  });
}
