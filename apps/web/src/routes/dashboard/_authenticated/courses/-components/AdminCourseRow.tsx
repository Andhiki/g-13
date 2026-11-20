import {
  AdminTableInspectButton,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { CatalogRowActions } from "@/routes/dashboard/_authenticated/-components/CatalogLifecycleActions";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
import { Typography } from "@/ui/typography";
import type { loadAdminCourses } from "../-server/handler";
import type { CourseLifecycleInput } from "../-shared/schemas";

export const courseTableColumns = "lg:grid-cols-[148px_minmax(0,1fr)_88px_148px]";

export type AdminCourse = Awaited<ReturnType<typeof loadAdminCourses>>["rows"][number];

export function AdminCourseRow({
  course,
  selected,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  course: AdminCourse;
  selected: boolean;
  onSelect: () => void;
  onEdit: (course: AdminCourse) => void;
  onLifecycle: (input: CourseLifecycleInput, label: string) => void;
}) {
  const deleted = course.deletedAt !== null;
  const label = `${course.code} · ${course.nameId}`;

  return (
    <AdminTableRow
      selected={selected}
      onSelect={onSelect}
      className={`${courseTableColumns} lg:items-center`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Typography variant="code" className="truncate font-medium text-text-strong-950">
          {course.code}
        </Typography>
        <div className="lg:hidden">
          <RecordStatusBadge deleted={deleted} />
        </div>
      </div>

      <div className="min-w-0">
        <AdminTableInspectButton
          ariaLabel={`Inspect ${label}`}
          selected={selected}
          onSelect={onSelect}
        >
          {course.nameId}
        </AdminTableInspectButton>
        <Typography variant="caption" className="mt-0.5 block truncate text-text-sub-600">
          {course.nameEn}
        </Typography>
      </div>

      <Typography variant="caption" className="text-text-sub-600 tabular-nums lg:text-right">
        <span className="lg:hidden">Reviews: </span>
        {course.reviewCount}
      </Typography>

      <CatalogRowActions
        deleted={deleted}
        onEdit={() => onEdit(course)}
        onDelete={() => onLifecycle({ courseId: course.id, action: "delete" }, label)}
        onRestore={() => onLifecycle({ courseId: course.id, action: "restore" }, label)}
      />
    </AdminTableRow>
  );
}
