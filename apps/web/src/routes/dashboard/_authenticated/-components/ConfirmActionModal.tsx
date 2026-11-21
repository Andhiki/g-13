import type { ReactNode } from "react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";

export function ConfirmActionModal({
  open,
  title,
  description,
  children,
  confirmLabel,
  error,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  error?: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlignModal.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onClose();
      }}
    >
      <AlignModal.Content className="p-5">
        <AlignModal.Title asChild className="pr-8">
          <Typography as="h2" variant="subtitle2" color="strong">
            {title}
          </Typography>
        </AlignModal.Title>
        <AlignModal.Description asChild className="mt-2 pr-4">
          <Typography variant="paragraph" color="muted">
            {description}
          </Typography>
        </AlignModal.Description>
        {children}
        {error && (
          <Typography role="alert" variant="caption" color="danger" className="mt-3">
            {error}
          </Typography>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <AlignButton.Root
            size="xsmall"
            variant="neutral"
            mode="stroke"
            className="px-3"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </AlignButton.Root>
          <AlignFancyButton.Root size="xsmall" isLoading={pending} onClick={onConfirm}>
            {confirmLabel}
          </AlignFancyButton.Root>
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
