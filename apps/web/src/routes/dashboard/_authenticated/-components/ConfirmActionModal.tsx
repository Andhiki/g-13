import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";

export function ConfirmActionModal({
  open,
  title,
  description,
  error,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
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
        <AlignModal.Title asChild>
          <Typography as="h2" variant="subtitle2" className="pr-8 text-text-strong-950">
            {title}
          </Typography>
        </AlignModal.Title>
        <AlignModal.Description asChild>
          <Typography variant="paragraph" className="mt-2 pr-4 text-text-sub-600">
            {description}
          </Typography>
        </AlignModal.Description>
        {error && (
          <Typography role="alert" variant="caption" className="mt-3 text-error-base">
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
            Confirm
          </AlignFancyButton.Root>
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
