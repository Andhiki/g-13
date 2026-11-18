import { queryOptions } from "@tanstack/react-query";
import type { UserStatus } from "../-shared/schemas";
import { loadAdminUsers } from "../-server/handler";

export const adminUsersQuery = (offset = 0, status: UserStatus = "all") =>
  queryOptions({
    queryKey: ["admin", "users", offset, status],
    queryFn: () => loadAdminUsers({ data: { offset, status } }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
