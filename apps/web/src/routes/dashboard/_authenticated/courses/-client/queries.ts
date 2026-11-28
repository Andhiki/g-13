import { queryOptions } from "@tanstack/react-query";
import type { CourseStatus } from "../-shared/schemas";
import { loadAdminCourses } from "../-server/handler";
import {
  ADMIN_STALE_TIME,
  adminRefetchOnFocus,
} from "@/routes/dashboard/_authenticated/-client/admin-query";

export const adminCoursesQuery = (offset = 0, status: CourseStatus = "active", query = "") =>
  queryOptions({
    queryKey: ["admin", "courses", offset, status, query],
    queryFn: () => loadAdminCourses({ data: { offset, status, query } }),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
    retry: false,
  });
