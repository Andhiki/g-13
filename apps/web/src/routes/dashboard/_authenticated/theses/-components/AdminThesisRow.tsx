import {
  AdminTableRow,
  AdminTableInspectButton,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { Typography } from "@/ui/typography";
import type { loadAdminTheses } from "../-server/handler";
import type { ThesisLifecycleInput } from "../-shared/schemas";
import { ThesisRowActions } from "./ThesisRowActions";
import { ThesisStatusBadge } from "./ThesisStatusBadge";

export const thesisTableColumns = "lg:grid-cols-[minmax(0,1fr)_104px_64px_252px]";

export type AdminThesis = Awaited<ReturnType<typeof loadAdminTheses>>["rows"][number];

export function AdminThesisRow({
  thesis,
  onEdit,
  onAction,
}: {
  thesis: AdminThesis;
  onEdit: (thesis: AdminThesis) => void;
  onAction: (thesis: AdminThesis, action: ThesisLifecycleInput["action"]) => void;
}) {
  const deleted = thesis.deletedAt !== null;
  return (
    <AdminTableRow
      selected={false}
      onSelect={deleted ? undefined : () => onEdit(thesis)}
      className={`${thesisTableColumns} lg:items-center`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {deleted ? (
            <Typography variant="label">{thesis.title}</Typography>
          ) : (
            <AdminTableInspectButton
              ariaLabel={`Edit ${thesis.title}`}
              selected={false}
              onSelect={() => onEdit(thesis)}
            >
              {thesis.title}
            </AdminTableInspectButton>
          )}
          <div className="lg:hidden">
            <ThesisStatusBadge status={deleted ? "deleted" : thesis.status} />
          </div>
        </div>
        <Typography variant="paragraph" color="muted" className="mt-0.5 block truncate">
          {thesis.authorName}
        </Typography>
        <Typography variant="code" color="muted" className="mt-0.5 block truncate">
          {thesis.id}
        </Typography>
      </div>

      <div className="hidden lg:block">
        <ThesisStatusBadge status={deleted ? "deleted" : thesis.status} />
      </div>

      <Typography variant="caption" color="muted" className="tabular-nums lg:text-right">
        <span className="lg:hidden">Year: </span>
        {thesis.year}
      </Typography>

      <ThesisRowActions
        status={thesis.status}
        deleted={deleted}
        onEdit={() => onEdit(thesis)}
        onAction={(action) => onAction(thesis, action)}
      />
    </AdminTableRow>
  );
}
