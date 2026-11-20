import { useRef, useState } from "react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";
import { lecturerFieldsSchema, type LecturerFieldsInput } from "../-shared/schemas";
import type { AdminLecturer } from "./AdminLecturerRow";

const fieldControlClass =
  "block min-h-9 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-base text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus:outline-none sm:text-paragraph-sm";

export function LecturerFormModal({
  open,
  lecturer,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  lecturer: AdminLecturer | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: LecturerFieldsInput) => void;
}) {
  return (
    <AlignModal.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onClose();
      }}
    >
      <AlignModal.Content className="max-w-[440px] p-0" aria-describedby={undefined}>
        {open && (
          <LecturerFormBody
            key={lecturer?.id ?? "new"}
            lecturer={lecturer}
            pending={pending}
            error={error}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        )}
      </AlignModal.Content>
    </AlignModal.Root>
  );
}

function LecturerFormBody({
  lecturer,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  lecturer: AdminLecturer | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: LecturerFieldsInput) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(lecturer?.name ?? "");
  const [nameError, setNameError] = useState<string | undefined>();
  const editing = lecturer !== null;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const parsed = lecturerFieldsSchema.safeParse({ name });
        if (!parsed.success) {
          setNameError(parsed.error.issues[0]?.message);
          requestAnimationFrame(() =>
            formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
          );
          return;
        }
        setNameError(undefined);
        onSubmit(parsed.data);
      }}
    >
      <header className="border-b border-stroke-soft-200 px-5 py-4 pr-12">
        <AlignModal.Title asChild>
          <Typography as="h2" variant="subtitle2" className="text-text-strong-950">
            {editing ? "Edit lecturer" : "Add lecturer"}
          </Typography>
        </AlignModal.Title>
      </header>
      <fieldset disabled={pending} className="space-y-4 p-5 disabled:opacity-70">
        <div>
          <Typography
            as="label"
            variant="labelSmall"
            htmlFor="lecturer-name"
            className="mb-1.5 block text-text-strong-950"
          >
            Full name
          </Typography>
          <input
            id="lecturer-name"
            name="name"
            type="text"
            maxLength={120}
            placeholder="e.g. Ahmad Ashari"
            value={name}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "lecturer-name-error" : undefined}
            className={fieldControlClass}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(undefined);
            }}
          />
          {nameError && (
            <Typography
              variant="caption"
              id="lecturer-name-error"
              className="mt-1.5 text-error-base"
            >
              {nameError}
            </Typography>
          )}
        </div>

        {error && (
          <Typography role="alert" variant="caption" className="text-error-base">
            {error}
          </Typography>
        )}
      </fieldset>
      <footer className="flex items-center justify-end gap-2 border-t border-stroke-soft-200 px-5 py-3.5">
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
        <AlignFancyButton.Root type="submit" size="xsmall" isLoading={pending}>
          {editing ? "Save changes" : "Add lecturer"}
        </AlignFancyButton.Root>
      </footer>
    </form>
  );
}
