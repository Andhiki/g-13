import {
  AdminTableInspectButton,
  AdminTableMeta,
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
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <Typography variant="code" color="strong" weight="medium" className="truncate">
          {course.code}
        </Typography>
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2 lg:block">
          <AdminTableInspectButton
            ariaLabel={`Inspect ${label}`}
            selected={selected}
            onSelect={onSelect}
          >
            {course.nameId}
          </AdminTableInspectButton>
          <div className="shrink-0 lg:hidden">
            <RecordStatusBadge deleted={deleted} />
          </div>
        </div>
        <Typography variant="caption" color="muted" className="mt-0.5 hidden truncate lg:block">
          {course.nameEn}
        </Typography>
        <AdminTableMeta>
          <span className="shrink-0 font-mono">{course.code}</span>
          <span className="shrink-0">· Reviews: {course.reviewCount}</span>
          <span className="truncate">· {course.nameEn}</span>
        </AdminTableMeta>
      </div>

      <Typography
        variant="caption"
        color="muted"
        className="hidden tabular-nums lg:block lg:text-right"
      >
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
