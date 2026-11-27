import { queryOptions } from "@tanstack/react-query";
import type { LecturerStatus } from "../-shared/schemas";
import { loadAdminLecturers } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminLecturersQuery = (offset = 0, status: LecturerStatus = "active", query = "") =>
  queryOptions({
    queryKey: ["admin", "lecturers", offset, status, query],
    queryFn: () => loadAdminLecturers({ data: { offset, status, query } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
