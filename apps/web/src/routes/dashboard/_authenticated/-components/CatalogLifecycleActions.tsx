import { RiDeleteBinLine, RiEditLine, RiRestartLine } from "@remixicon/react";
import type { ReactNode } from "react";
import { AdminTableAction } from "./AdminTable";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";

export function CatalogRowActions({
  deleted,
  onEdit,
  onDelete,
  onRestore,
  leadingAction,
}: {
  deleted: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  leadingAction?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-end lg:gap-1">
      {leadingAction}
      {!deleted ? (
        <>
          <AdminTableAction label="Edit" onClick={onEdit}>
            <RiEditLine aria-hidden="true" className="size-3.5" />
          </AdminTableAction>
          <AdminTableAction label="Delete" variant="error" onClick={onDelete}>
            <RiDeleteBinLine aria-hidden="true" className="size-3.5" />
          </AdminTableAction>
        </>
      ) : (
        <AdminTableAction label="Restore" onClick={onRestore}>
          <RiRestartLine aria-hidden="true" className="size-3.5" />
        </AdminTableAction>
      )}
    </div>
  );
}

export function CatalogInspectorActions({
  deleted,
  restoreLabel,
  onEdit,
  onDelete,
  onRestore,
}: {
  deleted: boolean;
  restoreLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  if (!deleted) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <AlignButton.Root
          size="small"
          variant="neutral"
          mode="stroke"
          compact
          className="w-full"
          onClick={onEdit}
        >
          <RiEditLine className="size-3.5" />
          Edit
        </AlignButton.Root>
        <AlignButton.Root
          size="small"
          variant="error"
          mode="lighter"
          compact
          className="w-full"
          onClick={onDelete}
        >
          <RiDeleteBinLine className="size-3.5" />
          Delete
        </AlignButton.Root>
      </div>
    );
  }

  return (
    <AlignFancyButton.Root size="small" compact className="w-full" onClick={onRestore}>
      <RiRestartLine className="size-3.5" />
      {restoreLabel}
    </AlignFancyButton.Root>
  );
}
