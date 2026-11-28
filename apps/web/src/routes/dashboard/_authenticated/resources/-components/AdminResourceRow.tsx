import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiDraggable, RiExternalLinkLine } from "@remixicon/react";
import {
  AdminTableInspectButton,
  AdminTableMeta,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { CatalogRowActions } from "@/routes/dashboard/_authenticated/-components/CatalogLifecycleActions";
import { RecordStatusBadge } from "@/routes/dashboard/_authenticated/-components/RecordStatusBadge";
import { formatRelativeTime } from "@/date-format";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import type { loadAdminResources } from "../-server/handler";
import { createSearchHighlight } from "../../-client/search-highlight";
import { resourceSearchFields, type ResourceLifecycleInput } from "../-shared/schemas";
import { ResourceFavicon, resourceHost } from "./ResourceFavicon";

const Highlight = createSearchHighlight(resourceSearchFields);

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
  const host = resourceHost(resource.url);
  const updated = formatRelativeTime(resource.updatedAt.getTime(), language);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: resource.id,
    disabled: !sortable,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const resourceIdentity = (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1 lg:gap-2">
        <button
          type="button"
          className={`flex size-11 shrink-0 touch-none max-lg:-ml-2 lg:size-6 items-center justify-center rounded text-text-sub-600 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-base ${
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
          <RiDraggable aria-hidden="true" className="size-4 max-lg:size-5" />
        </button>
        <ResourceRowIdentity
          resource={resource}
          selected={selected}
          onSelect={onSelect}
          host={host}
          updated={updated}
        />
      </div>
    </div>
  );

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
        {resourceIdentity}

        <ResourceRowLink url={resource.url} host={host} label={label} />

        <Typography
          variant="caption"
          color="muted"
          className="hidden tabular-nums lg:block"
          title={resource.updatedAt.toISOString()}
        >
          {updated}
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

function ResourceRowIdentity({
  resource,
  selected,
  onSelect,
  host,
  updated,
}: {
  resource: AdminResource;
  selected: boolean;
  onSelect: () => void;
  host: string;
  updated: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-2 lg:block">
        <AdminTableInspectButton
          ariaLabel={`Inspect ${resource.titleId}`}
          selected={selected}
          onSelect={onSelect}
        >
          <Highlight field="titleId">{resource.titleId}</Highlight>
        </AdminTableInspectButton>
        <div className="shrink-0 lg:hidden">
          <RecordStatusBadge deleted={resource.deletedAt !== null} />
        </div>
      </div>
      <Typography variant="caption" color="muted" className="mt-0.5 hidden truncate lg:block">
        <Highlight field="titleEn">{resource.titleEn}</Highlight>
      </Typography>
      <AdminTableMeta>
        <span className="truncate" title={`${host} · ${updated} · ${resource.titleEn}`}>
          <Highlight field="url">{host}</Highlight> · {updated} ·{" "}
          <Highlight field="titleEn">{resource.titleEn}</Highlight>
        </span>
      </AdminTableMeta>
    </div>
  );
}

function ResourceRowLink({ url, host, label }: { url: string; host: string; label: string }) {
  return (
    <div className="hidden min-w-0 lg:block">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={url}
        aria-label={`${host} — open ${label} in a new tab`}
        className="group flex min-w-0 items-center gap-1.5 text-label-xs text-text-sub-600 underline-offset-2 hover:text-text-strong-950 hover:underline"
      >
        <ResourceFavicon url={url} />
        <span className="truncate">
          <Highlight field="url">{host}</Highlight>
        </span>
        <RiExternalLinkLine
          aria-hidden="true"
          className="size-3.5 shrink-0 text-text-soft-400 group-hover:text-text-strong-950"
        />
      </a>
    </div>
  );
}
