import { ConfirmActionModal } from "@/routes/dashboard/_authenticated/-components/ConfirmActionModal";
import { ConfirmationChange } from "@/routes/dashboard/_authenticated/-components/ConfirmationChange";
import type { AdminThesis } from "./AdminThesisRow";
import { ThesisStatusBadge } from "./ThesisStatusBadge";
import type { ThesisLifecycleInput } from "../-shared/schemas";

export type ThesisConfirmation = {
  thesis: AdminThesis;
  action: ThesisLifecycleInput["action"];
};

const actionTitles: Record<ThesisLifecycleInput["action"], string> = {
  publish: "Confirm publish",
  hide: "Confirm hide",
  delete: "Confirm delete",
  restore: "Confirm restore",
};

const actionLabels: Record<ThesisLifecycleInput["action"], string> = {
  publish: "Publish thesis",
  hide: "Hide thesis",
  delete: "Delete thesis",
  restore: "Restore thesis",
};

const actionSummaries: Record<ThesisLifecycleInput["action"], string> = {
  publish:
    "This makes the thesis visible on the public directory. The record must have a title, author, year, supervisor, and recorded author consent.",
  hide: "This removes the thesis from the public directory. The record stays stored and can be published again.",
  delete:
    "This moves the thesis to Deleted and removes it from the public directory. You can restore it later as a draft.",
  restore: "This restores the thesis as a draft. Publish it again when the record is ready.",
};

export function ThesisLifecycleModal({
  confirmation,
  isError,
  isPending,
  onClose,
  onConfirm,
}: {
  confirmation: ThesisConfirmation | null;
  isError: boolean;
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
          {actionSummaries[action]}
        </span>
      }
      confirmLabel={actionLabels[action]}
      error={isError ? "Update failed. Refresh and try again." : undefined}
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
