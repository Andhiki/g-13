import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal, useModalOpen } from "@/ui/modal";
import { Typography } from "@/ui/typography";

const HOLD_DURATION_MS = 850;
const CANCEL_DURATION_MS = 150;

function HoldConfirmButton({
  confirmLabel,
  pending,
  onConfirm,
}: {
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const open = useModalOpen();
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelHold = useCallback(() => {
    clearTimer();
    setHolding(false);
  }, [clearTimer]);

  const startHold = useCallback(() => {
    if (pending || !open) return;
    clearTimer();
    setHolding(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setHolding(false);
      onConfirm();
    }, HOLD_DURATION_MS);
  }, [clearTimer, onConfirm, open, pending]);

  useEffect(() => {
    if (!open || pending) cancelHold();
  }, [cancelHold, open, pending]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.repeat) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      startHold();
    }
  };
  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      cancelHold();
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      aria-label={`Hold to ${confirmLabel}`}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        startHold();
      }}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onLostPointerCapture={cancelHold}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={cancelHold}
      className="relative inline-flex h-8 shrink-0 touch-none select-none items-center justify-center rounded-lg bg-error-base px-3 text-label-sm text-static-white outline-none transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-base disabled:pointer-events-none disabled:opacity-60 pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-full pointer-coarse:before:min-h-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      >
        <span
          style={{
            transform: holding ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left center",
            transitionProperty: "transform",
            transitionTimingFunction: holding ? "linear" : "cubic-bezier(0.22, 1, 0.36, 1)",
            transitionDuration: holding ? `${HOLD_DURATION_MS}ms` : `${CANCEL_DURATION_MS}ms`,
          }}
          className="block size-full bg-static-white/25"
        />
      </span>
      <span className="relative z-10">{confirmLabel}</span>
    </button>
  );
}

function ConfirmActionFooter({
  destructive,
  confirmLabel,
  pending,
  onClose,
  onConfirm,
}: {
  destructive: boolean;
  confirmLabel: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-end gap-2">
      <AlignButton.Root
        size="xsmall"
        variant="neutral"
        mode="stroke"
        wide
        disabled={pending}
        onClick={onClose}
      >
        Cancel
      </AlignButton.Root>
      {destructive ? (
        <HoldConfirmButton confirmLabel={confirmLabel} pending={pending} onConfirm={onConfirm} />
      ) : (
        <AlignFancyButton.Root size="xsmall" isLoading={pending} onClick={onConfirm}>
          {confirmLabel}
        </AlignFancyButton.Root>
      )}
    </div>
  );
}

export function ConfirmActionModal({
  open,
  title,
  description,
  children,
  confirmLabel,
  destructive = false,
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
  destructive?: boolean;
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
        <ConfirmActionFooter
          destructive={destructive}
          confirmLabel={confirmLabel}
          pending={pending}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
