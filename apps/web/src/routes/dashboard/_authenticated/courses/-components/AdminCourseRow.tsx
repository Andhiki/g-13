import { RiDeleteBinLine, RiEditLine, RiRestartLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { AdminTableRow } from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
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
        <Typography as="h3" variant="labelSmall" className="min-w-0 font-semibold">
          <AlignButton.Root
            variant="neutral"
            mode="ghost"
            size="xxsmall"
            onClick={onSelect}
            className="block h-auto max-w-full truncate rounded-sm p-0 text-left text-label-xs font-semibold text-text-strong-950 hover:bg-transparent hover:underline"
            aria-label={`Inspect ${label}`}
            aria-pressed={selected}
          >
            {course.nameId}
          </AlignButton.Root>
        </Typography>
        <Typography variant="caption" className="mt-0.5 block truncate text-text-sub-600">
          {course.nameEn}
        </Typography>
      </div>

      <Typography variant="caption" className="text-text-sub-600 tabular-nums lg:text-right">
        <span className="lg:hidden">Reviews: </span>
        {course.reviewCount}
      </Typography>

      <div className="flex items-center justify-end gap-1">
        {!deleted ? (
          <>
            <AlignButton.Root
              size="xxsmall"
              variant="neutral"
              mode="ghost"
              className="gap-1 text-label-xs"
              onClick={() => onEdit(course)}
            >
              <RiEditLine className="size-3.5" />
              Edit
            </AlignButton.Root>
            <AlignButton.Root
              size="xxsmall"
              variant="error"
              mode="ghost"
              className="gap-1 text-label-xs text-error-dark"
              onClick={() => onLifecycle({ courseId: course.id, action: "delete" }, label)}
            >
              <RiDeleteBinLine className="size-3.5" />
              Delete
            </AlignButton.Root>
          </>
        ) : (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            className="gap-1 text-label-xs"
            onClick={() => onLifecycle({ courseId: course.id, action: "restore" }, label)}
          >
            <RiRestartLine className="size-3.5" />
            Restore
          </AlignButton.Root>
        )}
      </div>
    </AdminTableRow>
  );
}
