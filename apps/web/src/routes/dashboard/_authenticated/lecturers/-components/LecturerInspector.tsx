import { RiDeleteBinLine, RiEditLine, RiRestartLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { formatAbsoluteTime, formatRelativeTime } from "@/date-format";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
import type { LecturerLifecycleInput } from "../-shared/schemas";
import type { AdminLecturer } from "./AdminLecturerRow";

export function LecturerInspector({
  lecturer,
  onEdit,
  onLifecycle,
}: {
  lecturer: AdminLecturer;
  onEdit: (lecturer: AdminLecturer) => void;
  onLifecycle: (input: LecturerLifecycleInput, label: string) => void;
}) {
  const { language } = useLocale("notifications");
  const deleted = lecturer.deletedAt !== null;

  return (
    <aside
      id="moderation-inspector"
      aria-label="Selected lecturer details"
      className="ml-auto flex h-full w-[320px] flex-col overflow-hidden border-l border-stroke-soft-200 bg-bg-white-0"
    >
      <div className="flex h-11 shrink-0 items-center border-b border-stroke-soft-200 px-4 text-label-xs">
        Lecturer details
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">
          <div className="flex items-start justify-between gap-2">
            <Typography as="h2" variant="label" className="min-w-0 break-words">
              {lecturer.name}
            </Typography>
            <RecordStatusBadge deleted={deleted} />
          </div>
          <dl className="space-y-2.5 text-paragraph-xs">
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Slug</dt>
              <dd className="break-all font-mono text-text-sub-600">{lecturer.id}</dd>
            </div>
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Reviews</dt>
              <dd className="tabular-nums">{lecturer.reviewCount}</dd>
            </div>
            {lecturer.deletedAt && (
              <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
                <dt className="text-text-sub-600">Deleted</dt>
                <dd title={formatAbsoluteTime(lecturer.deletedAt.getTime(), language)}>
                  {formatRelativeTime(lecturer.deletedAt.getTime(), language)}
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
              onClick={() => onEdit(lecturer)}
            >
              <RiEditLine className="size-3.5" />
              Edit
            </AlignButton.Root>
            <AlignButton.Root
              size="small"
              variant="error"
              mode="lighter"
              className="w-full gap-1.5 text-label-xs"
              onClick={() =>
                onLifecycle({ lecturerId: lecturer.id, action: "delete" }, lecturer.name)
              }
            >
              <RiDeleteBinLine className="size-3.5" />
              Delete
            </AlignButton.Root>
          </div>
        ) : (
          <AlignFancyButton.Root
            size="small"
            className="w-full gap-1.5 text-label-xs"
            onClick={() =>
              onLifecycle({ lecturerId: lecturer.id, action: "restore" }, lecturer.name)
            }
          >
            <RiRestartLine className="size-3.5" />
            Restore lecturer
          </AlignFancyButton.Root>
        )}
      </section>
    </aside>
  );
}
