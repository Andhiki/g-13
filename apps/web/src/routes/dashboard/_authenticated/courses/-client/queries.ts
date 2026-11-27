import { queryOptions } from "@tanstack/react-query";
import type { CourseStatus } from "../-shared/schemas";
import { loadAdminCourses } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminCoursesQuery = (offset = 0, status: CourseStatus = "active", query = "") =>
  queryOptions({
    queryKey: ["admin", "courses", offset, status, query],
    queryFn: () => loadAdminCourses({ data: { offset, status, query } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
