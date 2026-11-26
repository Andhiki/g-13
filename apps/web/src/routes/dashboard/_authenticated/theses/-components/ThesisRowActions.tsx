import {
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiEyeOffLine,
  RiRestartLine,
} from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import type { ThesisLifecycleInput } from "../-shared/schemas";
import type { ThesisStatus } from "../-shared/schemas";

export function ThesisRowActions({
  status,
  deleted,
  onEdit,
  onAction,
}: {
  status: ThesisStatus;
  deleted: boolean;
  onEdit: () => void;
  onAction: (action: ThesisLifecycleInput["action"]) => void;
}) {
  if (deleted) {
    return (
      <div className="flex items-center justify-end gap-1">
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          compact
          onClick={() => onAction("restore")}
        >
          <RiRestartLine className="size-3.5" />
          Restore
        </AlignButton.Root>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <AlignButton.Root size="xxsmall" variant="neutral" mode="ghost" compact onClick={onEdit}>
        <RiEditLine className="size-3.5" />
        Edit
      </AlignButton.Root>
      {status === "published" ? (
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          compact
          onClick={() => onAction("hide")}
        >
          <RiEyeOffLine className="size-3.5" />
          Hide
        </AlignButton.Root>
      ) : (
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          compact
          onClick={() => onAction("publish")}
        >
          <RiEyeLine className="size-3.5" />
          Publish
        </AlignButton.Root>
      )}
      <AlignButton.Root
        size="xxsmall"
        variant="error"
        mode="ghost"
        compact
        onClick={() => onAction("delete")}
      >
        <RiDeleteBinLine className="size-3.5" />
        Delete
      </AlignButton.Root>
    </div>
  );
}
