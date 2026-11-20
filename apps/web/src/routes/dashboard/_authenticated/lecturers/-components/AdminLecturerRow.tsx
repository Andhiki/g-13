import { RiDeleteBinLine, RiEditLine, RiRestartLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { AdminTableRow } from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
import type { loadAdminLecturers } from "../-server/handler";
import type { LecturerLifecycleInput } from "../-shared/schemas";

export const lecturerTableColumns = "lg:grid-cols-[minmax(0,1fr)_88px_148px]";

export type AdminLecturer = Awaited<ReturnType<typeof loadAdminLecturers>>["rows"][number];

export function AdminLecturerRow({
  lecturer,
  selected,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  lecturer: AdminLecturer;
  selected: boolean;
  onSelect: () => void;
  onEdit: (lecturer: AdminLecturer) => void;
  onLifecycle: (input: LecturerLifecycleInput, label: string) => void;
}) {
  const deleted = lecturer.deletedAt !== null;

  return (
    <AdminTableRow
      selected={selected}
      onSelect={onSelect}
      className={`${lecturerTableColumns} lg:items-center`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Typography as="h3" variant="labelSmall" className="min-w-0 font-semibold">
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              size="xxsmall"
              onClick={onSelect}
              className="block h-auto max-w-full truncate rounded-sm p-0 text-left text-label-xs font-semibold text-text-strong-950 hover:bg-transparent hover:underline"
              aria-label={`Inspect ${lecturer.name}`}
              aria-pressed={selected}
            >
              {lecturer.name}
            </AlignButton.Root>
          </Typography>
          <div className="lg:hidden">
            <RecordStatusBadge deleted={deleted} />
          </div>
        </div>
        <Typography variant="code" className="mt-0.5 block truncate text-text-sub-600">
          {lecturer.id}
        </Typography>
      </div>

      <Typography variant="caption" className="text-text-sub-600 tabular-nums lg:text-right">
        <span className="lg:hidden">Reviews: </span>
        {lecturer.reviewCount}
      </Typography>

      <div className="flex items-center justify-end gap-1">
        {!deleted ? (
          <>
            <AlignButton.Root
              size="xxsmall"
              variant="neutral"
              mode="ghost"
              className="gap-1 text-label-xs"
              onClick={() => onEdit(lecturer)}
            >
              <RiEditLine className="size-3.5" />
              Edit
            </AlignButton.Root>
            <AlignButton.Root
              size="xxsmall"
              variant="error"
              mode="ghost"
              className="gap-1 text-label-xs text-error-dark"
              onClick={() =>
                onLifecycle({ lecturerId: lecturer.id, action: "delete" }, lecturer.name)
              }
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
            onClick={() =>
              onLifecycle({ lecturerId: lecturer.id, action: "restore" }, lecturer.name)
            }
          >
            <RiRestartLine className="size-3.5" />
            Restore
          </AlignButton.Root>
        )}
      </div>
    </AdminTableRow>
  );
}
