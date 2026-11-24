import { useRef, type ReactNode } from "react";
import { Input } from "@ui-sdk/react/input";
import { Textarea } from "@ui-sdk/react/textarea";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";

const fieldControlClass =
  "block min-h-9 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-base text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus:outline-none sm:text-paragraph-sm";

export function AdminFormModal({
  open,
  pending,
  contentClassName = "max-w-[460px]",
  onClose,
  children,
}: {
  open: boolean;
  pending: boolean;
  contentClassName?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AlignModal.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onClose();
      }}
    >
      <AlignModal.Content className={`${contentClassName} p-0`} aria-describedby={undefined}>
        {open && children}
      </AlignModal.Content>
    </AlignModal.Root>
  );
}

export function AdminForm({
  title,
  submitLabel,
  pending,
  error,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  submitLabel: string;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: () => boolean | void;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        if (onSubmit() === false) {
          requestAnimationFrame(() =>
            formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
          );
        }
      }}
    >
      <header className="border-b border-stroke-soft-200 px-5 py-4 pr-12">
        <AlignModal.Title asChild>
          <Typography as="h2" variant="subtitle2" color="strong">
            {title}
          </Typography>
        </AlignModal.Title>
      </header>
      <fieldset disabled={pending} className="space-y-4 p-5 disabled:opacity-70">
        {children}
        {error && (
          <Typography role="alert" variant="caption" color="danger">
            {error}
          </Typography>
        )}
      </fieldset>
      <footer className="flex items-center justify-end gap-2 border-t border-stroke-soft-200 px-5 py-3.5">
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
        <AlignFancyButton.Root type="submit" size="xsmall" isLoading={pending}>
          {submitLabel}
        </AlignFancyButton.Root>
      </footer>
    </form>
  );
}

export function AdminFormField({
  id,
  name,
  label,
  value,
  maxLength,
  placeholder,
  error,
  type = "text",
  multiline = false,
  rows = 3,
  inputMode,
  autoComplete,
  readOnly = false,
  onChange,
  onBlur,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  maxLength: number;
  placeholder: string;
  error?: string;
  type?: "text" | "date" | "datetime-local" | "number";
  multiline?: boolean;
  rows?: number;
  inputMode?: "text" | "url" | "numeric";
  autoComplete?: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const errorId = `${id}-error`;
  const controlClassName = readOnly ? `${fieldControlClass} text-text-sub-600` : fieldControlClass;
  const controlProps = {
    id,
    name,
    placeholder,
    value,
    readOnly,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    className: controlClassName,
    onValueChange: onChange,
    onBlur,
  };

  return (
    <div>
      <Typography
        as="label"
        variant="labelSmall"
        color="strong"
        htmlFor={id}
        className="mb-1.5 block"
      >
        {label}
      </Typography>
      {multiline ? (
        <Textarea
          {...controlProps}
          rows={rows}
          maxLength={maxLength}
          className={`${controlClassName} resize-y`}
        />
      ) : (
        <Input
          {...controlProps}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={type === "text" ? maxLength : undefined}
          step={type === "number" ? 1 : undefined}
        />
      )}
      {error && (
        <Typography variant="caption" color="danger" id={errorId} className="mt-1.5">
          {error}
        </Typography>
      )}
    </div>
  );
}
