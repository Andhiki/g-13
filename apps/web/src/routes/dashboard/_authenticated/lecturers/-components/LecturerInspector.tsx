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
    <AdminInspectorPanel
      title="Lecturer details"
      ariaLabel="Selected lecturer details"
      footer={
        <CatalogInspectorActions
          deleted={deleted}
          restoreLabel="Restore lecturer"
          onEdit={() => onEdit(lecturer)}
          onDelete={() => onLifecycle({ lecturerId: lecturer.id, action: "delete" }, lecturer.name)}
          onRestore={() =>
            onLifecycle({ lecturerId: lecturer.id, action: "restore" }, lecturer.name)
          }
        />
      }
    >
      <div className="flex items-start justify-between gap-2">
        <Typography as="h2" variant="label" className="min-w-0 break-words">
          {lecturer.name}
        </Typography>
        <RecordStatusBadge deleted={deleted} />
      </div>
      <AdminInspectorMeta>
        <AdminInspectorMetaRow label="Slug" valueClassName="break-all font-mono text-text-sub-600">
          {lecturer.id}
        </AdminInspectorMetaRow>
        <AdminInspectorMetaRow label="Reviews" valueClassName="tabular-nums">
          {lecturer.reviewCount}
        </AdminInspectorMetaRow>
        {lecturer.deletedAt && (
          <AdminInspectorMetaRow
            label="Deleted"
            title={formatAbsoluteTime(lecturer.deletedAt.getTime(), language)}
          >
            {formatRelativeTime(lecturer.deletedAt.getTime(), language)}
          </AdminInspectorMetaRow>
        )}
      </AdminInspectorMeta>
    </AdminInspectorPanel>
  );
}
