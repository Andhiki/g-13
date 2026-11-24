import { queryOptions } from "@tanstack/react-query";
import type { LecturerStatus } from "../-shared/schemas";
import { loadAdminLecturers } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminLecturersQuery = (offset = 0, status: LecturerStatus = "active") =>
  queryOptions({
    queryKey: ["admin", "lecturers", offset, status],
    queryFn: () => loadAdminLecturers({ data: { offset, status } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
