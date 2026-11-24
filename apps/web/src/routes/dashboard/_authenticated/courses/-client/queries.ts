import { queryOptions } from "@tanstack/react-query";
import type { CourseStatus } from "../-shared/schemas";
import { loadAdminCourses } from "../-server/handler";

const dashboardStaleTime = 5 * 60 * 1000;

export const adminCoursesQuery = (offset = 0, status: CourseStatus = "active") =>
  queryOptions({
    queryKey: ["admin", "courses", offset, status],
    queryFn: () => loadAdminCourses({ data: { offset, status } }),
    staleTime: dashboardStaleTime,
    refetchOnWindowFocus: false,
    retry: false,
  });
