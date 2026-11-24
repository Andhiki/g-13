import {
  AdminTableInspectButton,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { CatalogRowActions } from "@/routes/dashboard/_authenticated/-components/CatalogLifecycleActions";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
import { formatRelativeTime } from "@/date-format";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import type { loadAdminResources } from "../-server/handler";
import type { ResourceLifecycleInput } from "../-shared/schemas";

export const resourceTableColumns = "lg:grid-cols-[minmax(0,1fr)_180px_64px_104px_148px]";

export type AdminResource = Awaited<ReturnType<typeof loadAdminResources>>["rows"][number];

function linkLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function AdminResourceRow({
  resource,
  selected,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  resource: AdminResource;
  selected: boolean;
  onSelect: () => void;
  onEdit: (resource: AdminResource) => void;
  onLifecycle: (input: ResourceLifecycleInput, label: string) => void;
}) {
  const { language } = useLocale("notifications");
  const deleted = resource.deletedAt !== null;
  const label = resource.titleId;

  return (
    <AdminTableRow
      selected={selected}
      onSelect={onSelect}
      className={`${resourceTableColumns} lg:items-center`}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <AdminTableInspectButton
            ariaLabel={`Inspect ${label}`}
            selected={selected}
            onSelect={onSelect}
          >
            {resource.titleId}
          </AdminTableInspectButton>
          <div className="lg:hidden">
            <RecordStatusBadge deleted={deleted} />
          </div>
        </div>
        <Typography variant="caption" color="muted" className="mt-0.5 block truncate">
          {resource.titleEn}
        </Typography>
      </div>

      <div className="min-w-0">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          title={resource.url}
          className="block truncate text-label-xs text-text-sub-600 underline-offset-2 hover:text-text-strong-950 hover:underline"
        >
          {linkLabel(resource.url)}
        </a>
      </div>

      <Typography variant="caption" color="muted" className="tabular-nums lg:text-right">
        <span className="lg:hidden">Order: </span>
        {resource.sortOrder}
      </Typography>

      <Typography
        variant="caption"
        color="muted"
        className="tabular-nums"
        title={resource.updatedAt.toISOString()}
      >
        {formatRelativeTime(resource.updatedAt.getTime(), language)}
      </Typography>

      <CatalogRowActions
        deleted={deleted}
        onEdit={() => onEdit(resource)}
        onDelete={() => onLifecycle({ resourceId: resource.id, action: "delete" }, label)}
        onRestore={() => onLifecycle({ resourceId: resource.id, action: "restore" }, label)}
      />
    </AdminTableRow>
  );
}
