import { queryOptions } from "@tanstack/react-query";
import type { ThesisStatusFilter } from "../-shared/schemas";
import { loadAdminTheses } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminThesesQuery = (offset = 0, status: ThesisStatusFilter = "draft", query = "") =>
  queryOptions({
    queryKey: ["admin", "theses", offset, status, query],
    queryFn: () => loadAdminTheses({ data: { offset, status, query } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
