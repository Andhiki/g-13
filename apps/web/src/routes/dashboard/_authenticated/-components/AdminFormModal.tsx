import { useRef, type ReactNode } from "react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal } from "@/ui/modal";
import { FormInput, FormTextarea } from "@/ui/form-control";
import { Typography } from "@/ui/typography";

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
  scrollFields = false,
  pending,
  error,
  beforeFields,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  submitLabel: string;
  scrollFields?: boolean;
  pending: boolean;
  error?: string;
  beforeFields?: ReactNode;
  onClose: () => void;
  onSubmit: () => boolean | void;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fields = (
    <fieldset disabled={pending} className="min-w-0 space-y-4 p-5 disabled:opacity-70">
      {children}
      {error && (
        <Typography role="alert" variant="caption" color="danger">
          {error}
        </Typography>
      )}
    </fieldset>
  );

  return (
    <form
      ref={formRef}
      className={scrollFields ? "flex min-h-0 flex-1 flex-col" : undefined}
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
      <header className="shrink-0 border-b border-stroke-soft-200 px-5 py-4 pr-12">
        <AlignModal.Title asChild>
          <Typography as="h2" variant="subtitle2" color="strong">
            {title}
          </Typography>
        </AlignModal.Title>
      </header>
      {beforeFields}
      {scrollFields ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{fields}</div>
      ) : (
        fields
      )}
      <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-stroke-soft-200 px-5 py-3.5">
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
  showCounter = false,
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
  showCounter?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const errorId = `${id}-error`;
  const controlProps = {
    id,
    name,
    placeholder,
    value,
    readOnly,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    onValueChange: onChange,
    onBlur,
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <Typography as="label" variant="labelSmall" color="strong" htmlFor={id}>
          {label}
        </Typography>
        {showCounter && (
          <Typography
            variant="caption"
            color={value.length > maxLength ? "danger" : "muted"}
            className="shrink-0 tabular-nums"
          >
            {value.length}/{maxLength}
          </Typography>
        )}
      </div>
      {multiline ? (
        <FormTextarea
          {...controlProps}
          rows={rows}
          maxLength={maxLength}
          className="sm:pointer-fine:min-h-8 read-only:text-text-sub-600"
        />
      ) : (
        <FormInput
          {...controlProps}
          className="sm:pointer-fine:min-h-8 read-only:text-text-sub-600"
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
