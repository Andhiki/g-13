import { RiDeleteBinLine, RiEditLine, RiRestartLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { formatAbsoluteTime, formatRelativeTime } from "@/date-format";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
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
    <aside
      id="moderation-inspector"
      aria-label="Selected course details"
      className="ml-auto flex h-full w-[320px] flex-col overflow-hidden border-l border-stroke-soft-200 bg-bg-white-0"
    >
      <div className="flex h-11 shrink-0 items-center border-b border-stroke-soft-200 px-4 text-label-xs">
        Course details
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">
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
          <dl className="space-y-2.5 text-paragraph-xs">
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Code</dt>
              <dd className="break-words font-mono">{course.code}</dd>
            </div>
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">ID</dt>
              <dd className="break-all font-mono text-text-sub-600">{course.id}</dd>
            </div>
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Reviews</dt>
              <dd className="tabular-nums">{course.reviewCount}</dd>
            </div>
            {course.deletedAt && (
              <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
                <dt className="text-text-sub-600">Deleted</dt>
                <dd title={formatAbsoluteTime(course.deletedAt.getTime(), language)}>
                  {formatRelativeTime(course.deletedAt.getTime(), language)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      <section className="shrink-0 border-t border-stroke-soft-200 p-3">
        {!deleted ? (
          <div className="grid grid-cols-2 gap-2">
            <AlignButton.Root
              size="small"
              variant="neutral"
              mode="stroke"
              className="w-full gap-1.5 text-label-xs"
              onClick={() => onEdit(course)}
            >
              <RiEditLine className="size-3.5" />
              Edit
            </AlignButton.Root>
            <AlignButton.Root
              size="small"
              variant="error"
              mode="lighter"
              className="w-full gap-1.5 text-label-xs"
              onClick={() => onLifecycle({ courseId: course.id, action: "delete" }, label)}
            >
              <RiDeleteBinLine className="size-3.5" />
              Delete
            </AlignButton.Root>
          </div>
        ) : (
          <AlignFancyButton.Root
            size="small"
            className="w-full gap-1.5 text-label-xs"
            onClick={() => onLifecycle({ courseId: course.id, action: "restore" }, label)}
          >
            <RiRestartLine className="size-3.5" />
            Restore course
          </AlignFancyButton.Root>
        )}
      </section>
    </aside>
  );
}
