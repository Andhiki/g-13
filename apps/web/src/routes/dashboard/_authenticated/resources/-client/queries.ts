import { queryOptions } from "@tanstack/react-query";
import type { ResourceStatus } from "../-shared/schemas";
import { loadAdminResources } from "../-server/handler";
import {
  ADMIN_STALE_TIME,
  adminRefetchOnFocus,
} from "@/routes/dashboard/_authenticated/-client/admin-query";

export const adminResourcesQuery = (offset = 0, status: ResourceStatus = "active", query = "") =>
  queryOptions({
    queryKey: ["admin", "resources", offset, status, query],
    queryFn: () => loadAdminResources({ data: { offset, status, query } }),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
    retry: false,
  });
