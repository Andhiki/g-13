import { queryOptions } from "@tanstack/react-query";
import type { UserStatus } from "../-shared/schemas";
import { loadAdminUsers } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminUsersQuery = (offset = 0, status: UserStatus = "all") =>
  queryOptions({
    queryKey: ["admin", "users", offset, status],
    queryFn: () => loadAdminUsers({ data: { offset, status } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
