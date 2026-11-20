import { useRef, useState } from "react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";
import { courseFieldsSchema, type CourseFieldsInput } from "../-shared/schemas";
import type { AdminCourse } from "./AdminCourseRow";

const fieldControlClass =
  "block min-h-9 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-base text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus:outline-none sm:text-paragraph-sm";

type FieldErrors = Partial<Record<keyof CourseFieldsInput, string>>;

export function CourseFormModal({
  open,
  course,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  course: AdminCourse | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CourseFieldsInput) => void;
}) {
  return (
    <AlignModal.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onClose();
      }}
    >
      <AlignModal.Content className="max-w-[460px] p-0" aria-describedby={undefined}>
        {open && (
          <CourseFormBody
            key={course?.id ?? "new"}
            course={course}
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

function CourseFormBody({
  course,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  course: AdminCourse | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CourseFieldsInput) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState(course?.code ?? "");
  const [nameId, setNameId] = useState(course?.nameId ?? "");
  const [nameEn, setNameEn] = useState(course?.nameEn ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const editing = course !== null;
  const clearFieldError = (field: keyof CourseFieldsInput) =>
    setFieldErrors((current) => ({ ...current, [field]: undefined }));

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const parsed = courseFieldsSchema.safeParse({ code, nameId, nameEn });
        if (!parsed.success) {
          const nextErrors: FieldErrors = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path[0] as keyof CourseFieldsInput | undefined;
            if (key && !nextErrors[key]) nextErrors[key] = issue.message;
          }
          setFieldErrors(nextErrors);
          requestAnimationFrame(() =>
            formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
          );
          return;
        }
        setFieldErrors({});
        onSubmit(parsed.data);
      }}
    >
      <header className="border-b border-stroke-soft-200 px-5 py-4 pr-12">
        <AlignModal.Title asChild>
          <Typography as="h2" variant="subtitle2" className="text-text-strong-950">
            {editing ? "Edit course" : "Add course"}
          </Typography>
        </AlignModal.Title>
      </header>
      <fieldset disabled={pending} className="space-y-4 p-5 disabled:opacity-70">
        <div>
          <Typography
            as="label"
            variant="labelSmall"
            htmlFor="course-code"
            className="mb-1.5 block text-text-strong-950"
          >
            Course code
          </Typography>
          <input
            id="course-code"
            name="code"
            type="text"
            maxLength={40}
            placeholder="e.g. PACS262301"
            value={code}
            aria-invalid={Boolean(fieldErrors.code)}
            aria-describedby={fieldErrors.code ? "course-code-error" : undefined}
            className={fieldControlClass}
            onChange={(event) => {
              setCode(event.target.value);
              clearFieldError("code");
            }}
          />
          {fieldErrors.code && (
            <Typography variant="caption" id="course-code-error" className="mt-1.5 text-error-base">
              {fieldErrors.code}
            </Typography>
          )}
        </div>

        <div>
          <Typography
            as="label"
            variant="labelSmall"
            htmlFor="course-name-id"
            className="mb-1.5 block text-text-strong-950"
          >
            Name (Indonesian)
          </Typography>
          <input
            id="course-name-id"
            name="nameId"
            type="text"
            maxLength={200}
            placeholder="e.g. Basis Data"
            value={nameId}
            aria-invalid={Boolean(fieldErrors.nameId)}
            aria-describedby={fieldErrors.nameId ? "course-name-id-error" : undefined}
            className={fieldControlClass}
            onChange={(event) => {
              setNameId(event.target.value);
              clearFieldError("nameId");
            }}
          />
          {fieldErrors.nameId && (
            <Typography
              variant="caption"
              id="course-name-id-error"
              className="mt-1.5 text-error-base"
            >
              {fieldErrors.nameId}
            </Typography>
          )}
        </div>

        <div>
          <Typography
            as="label"
            variant="labelSmall"
            htmlFor="course-name-en"
            className="mb-1.5 block text-text-strong-950"
          >
            Name (English)
          </Typography>
          <input
            id="course-name-en"
            name="nameEn"
            type="text"
            maxLength={200}
            placeholder="e.g. Database"
            value={nameEn}
            aria-invalid={Boolean(fieldErrors.nameEn)}
            aria-describedby={fieldErrors.nameEn ? "course-name-en-error" : undefined}
            className={fieldControlClass}
            onChange={(event) => {
              setNameEn(event.target.value);
              clearFieldError("nameEn");
            }}
          />
          {fieldErrors.nameEn && (
            <Typography
              variant="caption"
              id="course-name-en-error"
              className="mt-1.5 text-error-base"
            >
              {fieldErrors.nameEn}
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
          {editing ? "Save changes" : "Add course"}
        </AlignFancyButton.Root>
      </footer>
    </form>
  );
}
