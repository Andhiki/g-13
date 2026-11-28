import {
  AdminTableInspectButton,
  AdminTableMeta,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { CatalogRowActions } from "@/routes/dashboard/_authenticated/-components/CatalogLifecycleActions";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
import { Typography } from "@/ui/typography";
import type { loadAdminLecturers } from "../-server/handler";
import { createSearchHighlight } from "../../-client/search-highlight";
import { lecturerSearchFields, type LecturerLifecycleInput } from "../-shared/schemas";

const Highlight = createSearchHighlight(lecturerSearchFields);

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
          <AdminTableInspectButton
            ariaLabel={`Inspect ${lecturer.name}`}
            selected={selected}
            onSelect={onSelect}
          >
            <Highlight field="name">{lecturer.name}</Highlight>
          </AdminTableInspectButton>
          <div className="shrink-0 lg:hidden">
            <RecordStatusBadge deleted={deleted} />
          </div>
        </div>
        <Typography variant="code" color="muted" className="mt-0.5 hidden truncate lg:block">
          <Highlight field="id">{lecturer.id}</Highlight>
        </Typography>
        <AdminTableMeta>
          <span className="shrink-0">Reviews: {lecturer.reviewCount}</span>
          <span className="truncate font-mono">
            · <Highlight field="id">{lecturer.id}</Highlight>
          </span>
        </AdminTableMeta>
      </div>

      <Typography
        variant="caption"
        color="muted"
        className="hidden tabular-nums lg:block lg:text-right"
      >
        {lecturer.reviewCount}
      </Typography>

      <CatalogRowActions
        deleted={deleted}
        onEdit={() => onEdit(lecturer)}
        onDelete={() => onLifecycle({ lecturerId: lecturer.id, action: "delete" }, lecturer.name)}
        onRestore={() => onLifecycle({ lecturerId: lecturer.id, action: "restore" }, lecturer.name)}
      />
    </AdminTableRow>
  );
}
