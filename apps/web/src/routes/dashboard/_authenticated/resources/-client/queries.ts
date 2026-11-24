import { queryOptions } from "@tanstack/react-query";
import type { ResourceStatus } from "../-shared/schemas";
import { loadAdminResources } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminResourcesQuery = (offset = 0, status: ResourceStatus = "active") =>
  queryOptions({
    queryKey: ["admin", "resources", offset, status],
    queryFn: () => loadAdminResources({ data: { offset, status } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
