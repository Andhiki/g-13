import { queryOptions } from "@tanstack/react-query";
import type { ResourceStatus } from "../-shared/schemas";
import { loadAdminResources } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminResourcesQuery = (offset = 0, status: ResourceStatus = "active", query = "") =>
  queryOptions({
    queryKey: ["admin", "resources", offset, status, query],
    queryFn: () => loadAdminResources({ data: { offset, status, query } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
