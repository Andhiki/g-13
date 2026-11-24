import { ConfirmActionModal } from "../../-components/ConfirmActionModal";
import { ConfirmationChange } from "../../-components/ConfirmationChange";
import { RecordStatusBadge } from "../../-components/RecordStatusBadge";
import { type ResourceLifecycleInput } from "../-shared/schemas";

export function ResourceLifecycleModal({
  confirmation,
  isError,
  isPending,
  onClose,
  onConfirm,
}: {
  confirmation: { input: ResourceLifecycleInput; label: string } | null;
  isError: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const deleting = confirmation?.input.action === "delete";
  const summary = deleting
    ? "This hides the resource from the public resources page. The record is kept and you can restore it anytime."
    : "This restores the resource to the public page in its saved order.";

  return (
    <ConfirmActionModal
      open={confirmation !== null}
      destructive={deleting}
      title={deleting ? "Confirm delete" : "Confirm restore"}
      description={
        <>
          <strong className="text-text-strong-950">{confirmation?.label}</strong>. {summary}
        </>
      }
      confirmLabel={deleting ? "Delete resource" : "Restore resource"}
      error={isError ? "Update failed. Refresh and try again." : undefined}
      pending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {confirmation && (
        <ConfirmationChange
          from={<RecordStatusBadge deleted={confirmation.input.action === "restore"} />}
          to={<RecordStatusBadge deleted={deleting} />}
        />
      )}
    </ConfirmActionModal>
  );
}
