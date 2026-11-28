import { queryOptions } from "@tanstack/react-query";
import type { UserStatus } from "../-shared/schemas";
import { loadAdminUsers } from "../-server/handler";
import {
  ADMIN_STALE_TIME,
  adminRefetchOnFocus,
} from "@/routes/dashboard/_authenticated/-client/admin-query";

export const adminUsersQuery = (offset = 0, status: UserStatus = "all") =>
  queryOptions({
    queryKey: ["admin", "users", offset, status],
    queryFn: () => loadAdminUsers({ data: { offset, status } }),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
    retry: false,
  });
