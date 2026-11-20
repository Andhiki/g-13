import {
  AdminInspectorMeta,
  AdminInspectorMetaRow,
  AdminInspectorPanel,
} from "@/routes/dashboard/_authenticated/-components/AdminInspector";
import { CatalogInspectorActions } from "@/routes/dashboard/_authenticated/-components/CatalogLifecycleActions";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
import { formatAbsoluteTime, formatRelativeTime } from "@/date-format";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import type { CourseLifecycleInput } from "../-shared/schemas";
import type { AdminCourse } from "./AdminCourseRow";

export function CourseInspector({
  course,
  onEdit,
  onLifecycle,
}: {
  course: AdminCourse;
  onEdit: (course: AdminCourse) => void;
  onLifecycle: (input: CourseLifecycleInput, label: string) => void;
}) {
  const { language } = useLocale("notifications");
  const deleted = course.deletedAt !== null;
  const label = `${course.code} · ${course.nameId}`;

  return (
    <AdminInspectorPanel
      title="Course details"
      ariaLabel="Selected course details"
      footer={
        <CatalogInspectorActions
          deleted={deleted}
          restoreLabel="Restore course"
          onEdit={() => onEdit(course)}
          onDelete={() => onLifecycle({ courseId: course.id, action: "delete" }, label)}
          onRestore={() => onLifecycle({ courseId: course.id, action: "restore" }, label)}
        />
      }
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <Typography as="h2" variant="label" className="min-w-0 break-words">
            {course.nameId}
          </Typography>
          <RecordStatusBadge deleted={deleted} />
        </div>
        <Typography variant="caption" className="mt-1 block break-words text-text-sub-600">
          {course.nameEn}
        </Typography>
      </div>
      <AdminInspectorMeta>
        <AdminInspectorMetaRow label="Code" valueClassName="break-words font-mono">
          {course.code}
        </AdminInspectorMetaRow>
        <AdminInspectorMetaRow label="ID" valueClassName="break-all font-mono text-text-sub-600">
          {course.id}
        </AdminInspectorMetaRow>
        <AdminInspectorMetaRow label="Reviews" valueClassName="tabular-nums">
          {course.reviewCount}
        </AdminInspectorMetaRow>
        {course.deletedAt && (
          <AdminInspectorMetaRow
            label="Deleted"
            title={formatAbsoluteTime(course.deletedAt.getTime(), language)}
          >
            {formatRelativeTime(course.deletedAt.getTime(), language)}
          </AdminInspectorMetaRow>
        )}
      </AdminInspectorMeta>
    </AdminInspectorPanel>
  );
}
