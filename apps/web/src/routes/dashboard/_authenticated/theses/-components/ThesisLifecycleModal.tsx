import { ConfirmActionModal } from "@/routes/dashboard/_authenticated/-components/ConfirmActionModal";
import { ConfirmationChange } from "@/routes/dashboard/_authenticated/-components/ConfirmationChange";
import type { AdminThesis } from "./AdminThesisRow";
import { ThesisStatusBadge } from "./ThesisStatusBadge";
import { THESIS_ADMIN_ERRORS } from "../-shared/errors";
import type { ThesisLifecycleInput } from "../-shared/schemas";

export type ThesisConfirmation = {
  thesis: AdminThesis;
  action: ThesisLifecycleInput["action"];
};

const actionTitles: Record<ThesisLifecycleInput["action"], string> = {
  publish: "Publish thesis?",
  hide: "Hide thesis?",
  delete: "Delete thesis?",
  restore: "Restore thesis?",
};

const actionLabels: Record<ThesisLifecycleInput["action"], string> = {
  publish: "Publish thesis",
  hide: "Hide thesis",
  delete: "Delete thesis",
  restore: "Restore thesis",
};

const actionSummaries: Record<ThesisLifecycleInput["action"], string> = {
  publish:
    "The thesis will appear in the public directory. Publishing requires recorded author consent.",
  hide: "The thesis will leave the public directory. You can publish it again.",
  delete: "You can restore this thesis as a draft. Hold the delete button to confirm.",
  restore: "The thesis will return to Draft.",
};

export function ThesisLifecycleModal({
  confirmation,
  error,
  isPending,
  onClose,
  onConfirm,
}: {
  confirmation: ThesisConfirmation | null;
  error: Error | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const action = confirmation?.action ?? "publish";
  const fromStatus = confirmation?.thesis.deletedAt
    ? "deleted"
    : (confirmation?.thesis.status ?? "draft");
  const toStatus =
    action === "publish"
      ? "published"
      : action === "hide"
        ? "hidden"
        : action === "restore"
          ? "draft"
          : "deleted";

  return (
    <ConfirmActionModal
      open={confirmation !== null}
      destructive={action === "delete"}
      title={actionTitles[action]}
      description={
        <span>
          <strong className="text-text-strong-950">{confirmation?.thesis.title}</strong>.{" "}
          {action === "delete" &&
            fromStatus === "published" &&
            "The thesis will leave the public directory. "}
          {actionSummaries[action]}
        </span>
      }
      confirmLabel={actionLabels[action]}
      error={
        error?.message === THESIS_ADMIN_ERRORS.CONSENT_REQUIRED
          ? "Edit the thesis to add the author’s consent date and source before publishing."
          : error?.message === THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE && action === "publish"
            ? "Check that the thesis is still available and has a title, author, and supervisor."
            : error
              ? "Update failed. Refresh and try again."
              : undefined
      }
      pending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {confirmation && (
        <ConfirmationChange
          from={<ThesisStatusBadge status={fromStatus} />}
          to={<ThesisStatusBadge status={toStatus} />}
        />
      )}
    </ConfirmActionModal>
  );
}
