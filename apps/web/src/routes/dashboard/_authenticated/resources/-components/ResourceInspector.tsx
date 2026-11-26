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
import type { ResourceLifecycleInput } from "../-shared/schemas";
import type { AdminResource } from "./AdminResourceRow";

export function ResourceInspector({
  resource,
  onEdit,
  onLifecycle,
}: {
  resource: AdminResource;
  onEdit: (resource: AdminResource) => void;
  onLifecycle: (input: ResourceLifecycleInput, label: string) => void;
}) {
  const { language } = useLocale("notifications");
  const deleted = resource.deletedAt !== null;
  const label = resource.titleId;

  const link = (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline-offset-2 hover:underline"
    >
      {resource.url}
    </a>
  );

  return (
    <AdminInspectorPanel
      title="Resource details"
      ariaLabel="Selected learning resource details"
      footer={
        <CatalogInspectorActions
          deleted={deleted}
          restoreLabel="Restore resource"
          onEdit={() => onEdit(resource)}
          onDelete={() => onLifecycle({ resourceId: resource.id, action: "delete" }, label)}
          onRestore={() => onLifecycle({ resourceId: resource.id, action: "restore" }, label)}
        />
      }
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <Typography as="h2" variant="label" className="min-w-0 break-words">
            {resource.titleId}
          </Typography>
          <RecordStatusBadge deleted={deleted} />
        </div>
        <Typography variant="caption" color="muted" className="mt-1 block break-words">
          {resource.titleEn}
        </Typography>
      </div>
      <div className="space-y-2">
        <Typography variant="caption" color="muted" className="block break-words">
          {resource.descriptionId}
        </Typography>
        <Typography variant="caption" color="muted" className="block break-words">
          {resource.descriptionEn}
        </Typography>
      </div>
      <AdminInspectorMeta>
        <AdminInspectorMetaRow label="ID" valueClassName="break-all font-mono text-text-sub-600">
          {resource.id}
        </AdminInspectorMetaRow>
        <AdminInspectorMetaRow label="Link" valueClassName="break-all">
          {link}
        </AdminInspectorMetaRow>
        <AdminInspectorMetaRow label="Order" valueClassName="tabular-nums">
          {resource.sortOrder}
        </AdminInspectorMetaRow>
        <AdminInspectorMetaRow
          label="Updated"
          valueClassName="tabular-nums"
          title={formatAbsoluteTime(resource.updatedAt.getTime(), language)}
        >
          {formatRelativeTime(resource.updatedAt.getTime(), language)}
        </AdminInspectorMetaRow>
        {resource.deletedAt && (
          <AdminInspectorMetaRow
            label="Deleted"
            title={formatAbsoluteTime(resource.deletedAt.getTime(), language)}
          >
            {formatRelativeTime(resource.deletedAt.getTime(), language)}
          </AdminInspectorMetaRow>
        )}
      </AdminInspectorMeta>
    </AdminInspectorPanel>
  );
}
