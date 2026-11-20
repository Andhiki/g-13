import { RiDeleteBinLine, RiEditLine, RiRestartLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";

export function CatalogRowActions({
  deleted,
  onEdit,
  onDelete,
  onRestore,
}: {
  deleted: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {!deleted ? (
        <>
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            className="gap-1 text-label-xs"
            onClick={onEdit}
          >
            <RiEditLine className="size-3.5" />
            Edit
          </AlignButton.Root>
          <AlignButton.Root
            size="xxsmall"
            variant="error"
            mode="ghost"
            className="gap-1 text-label-xs text-error-dark"
            onClick={onDelete}
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
          onClick={onRestore}
        >
          <RiRestartLine className="size-3.5" />
          Restore
        </AlignButton.Root>
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
          className="w-full gap-1.5 text-label-xs"
          onClick={onEdit}
        >
          <RiEditLine className="size-3.5" />
          Edit
        </AlignButton.Root>
        <AlignButton.Root
          size="small"
          variant="error"
          mode="lighter"
          className="w-full gap-1.5 text-label-xs"
          onClick={onDelete}
        >
          <RiDeleteBinLine className="size-3.5" />
          Delete
        </AlignButton.Root>
      </div>
    );
  }

  return (
    <AlignFancyButton.Root
      size="small"
      className="w-full gap-1.5 text-label-xs"
      onClick={onRestore}
    >
      <RiRestartLine className="size-3.5" />
      {restoreLabel}
    </AlignFancyButton.Root>
  );
}
