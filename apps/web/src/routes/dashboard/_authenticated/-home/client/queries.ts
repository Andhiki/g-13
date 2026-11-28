import { queryOptions } from "@tanstack/react-query";
import { loadDashboardHome } from "../server/handler";
import {
  ADMIN_STALE_TIME,
  adminRefetchOnFocus,
} from "@/routes/dashboard/_authenticated/-client/admin-query";

export const dashboardHomeQuery = () =>
  queryOptions({
    queryKey: ["admin", "home"],
    queryFn: () => loadDashboardHome(),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
    retry: false,
  });
