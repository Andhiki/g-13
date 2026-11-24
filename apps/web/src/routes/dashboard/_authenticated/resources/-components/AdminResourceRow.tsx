import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiDraggable, RiExternalLinkLine } from "@remixicon/react";
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
import { ResourceFavicon, resourceHost } from "./ResourceFavicon";

export const resourceTableColumns = "lg:grid-cols-[minmax(0,1fr)_220px_120px_148px]";

export type AdminResource = Awaited<ReturnType<typeof loadAdminResources>>["rows"][number];

export function AdminResourceRow({
  resource,
  selected,
  sortable,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  resource: AdminResource;
  selected: boolean;
  sortable: boolean;
  onSelect: () => void;
  onEdit: (resource: AdminResource) => void;
  onLifecycle: (input: ResourceLifecycleInput, label: string) => void;
}) {
  const { language } = useLocale("notifications");
  const deleted = resource.deletedAt !== null;
  const label = resource.titleId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: resource.id,
    disabled: !sortable,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "relative z-20 opacity-80" : undefined}
    >
      <AdminTableRow
        selected={selected}
        onSelect={onSelect}
        className={`${resourceTableColumns} lg:items-center`}
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className={`flex size-6 shrink-0 touch-none items-center justify-center rounded text-text-sub-600 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-base ${
                sortable
                  ? "cursor-grab hover:bg-bg-soft-200/60 hover:text-text-strong-950 active:cursor-grabbing"
                  : "cursor-not-allowed opacity-40"
              }`}
              aria-label={`Reorder ${label}`}
              title={sortable ? "Drag to reorder" : "Clear the search to reorder"}
              disabled={!sortable}
              {...attributes}
              {...listeners}
            >
              <RiDraggable aria-hidden="true" className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <AdminTableInspectButton
                ariaLabel={`Inspect ${label}`}
                selected={selected}
                onSelect={onSelect}
              >
                {resource.titleId}
              </AdminTableInspectButton>
              <Typography variant="caption" color="muted" className="mt-0.5 block truncate">
                {resource.titleEn}
              </Typography>
            </div>
            <div className="lg:hidden">
              <RecordStatusBadge deleted={deleted} />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            title={resource.url}
            aria-label={`${resourceHost(resource.url)} — open ${label} in a new tab`}
            className="group flex min-w-0 items-center gap-1.5 text-label-xs text-text-sub-600 underline-offset-2 hover:text-text-strong-950 hover:underline"
          >
            <ResourceFavicon url={resource.url} />
            <span className="truncate">{resourceHost(resource.url)}</span>
            <RiExternalLinkLine
              aria-hidden="true"
              className="size-3.5 shrink-0 text-text-soft-400 group-hover:text-text-strong-950"
            />
          </a>
        </div>

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
    </div>
  );
}
