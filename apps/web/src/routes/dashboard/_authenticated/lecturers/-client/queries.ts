import { queryOptions } from "@tanstack/react-query";
import type { LecturerStatus } from "../-shared/schemas";
import { loadAdminLecturers } from "../-server/handler";
import {
  ADMIN_STALE_TIME,
  adminRefetchOnFocus,
} from "@/routes/dashboard/_authenticated/-client/admin-query";

export const adminLecturersQuery = (offset = 0, status: LecturerStatus = "active", query = "") =>
  queryOptions({
    queryKey: ["admin", "lecturers", offset, status, query],
    queryFn: () => loadAdminLecturers({ data: { offset, status, query } }),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: adminRefetchOnFocus,
    retry: false,
  });
