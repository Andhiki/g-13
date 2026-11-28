import { useState } from "react";
import {
  AdminForm,
  AdminFormField,
  AdminFormModal,
  AdminFormRow,
} from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import { courseFieldsSchema, type CourseFieldsInput } from "../-shared/schemas";
import type { AdminCourse } from "./AdminCourseRow";

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
    <AdminFormModal
      open={open}
      pending={pending}
      contentClassName="max-w-[640px]"
      onClose={onClose}
    >
      <CourseFormBody
        key={course?.id ?? "new"}
        course={course}
        pending={pending}
        error={error}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AdminFormModal>
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
  const [code, setCode] = useState(course?.code ?? "");
  const [nameId, setNameId] = useState(course?.nameId ?? "");
  const [nameEn, setNameEn] = useState(course?.nameEn ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const editing = course !== null;
  const clearFieldError = (field: keyof CourseFieldsInput) =>
    setFieldErrors((current) => ({ ...current, [field]: undefined }));

  return (
    <AdminForm
      title={editing ? "Edit course" : "Add course"}
      submitLabel={editing ? "Save changes" : "Add course"}
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={() => {
        const parsed = courseFieldsSchema.safeParse({ code, nameId, nameEn });
        if (!parsed.success) {
          const nextErrors: FieldErrors = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path[0] as keyof CourseFieldsInput | undefined;
            if (key && !nextErrors[key]) nextErrors[key] = issue.message;
          }
          setFieldErrors(nextErrors);
          return false;
        }
        setFieldErrors({});
        onSubmit(parsed.data);
      }}
    >
      <AdminFormRow label="Code" htmlFor="course-code">
        <AdminFormField
          id="course-code"
          name="code"
          maxLength={40}
          placeholder="PACS262301"
          value={code}
          readOnly={editing}
          error={fieldErrors.code}
          onChange={(value) => {
            setCode(value);
            clearFieldError("code");
          }}
        />
      </AdminFormRow>
      <AdminFormRow label="Name">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField
            id="course-name-id"
            name="nameId"
            label="Indonesian"
            maxLength={200}
            placeholder="Basis Data"
            value={nameId}
            error={fieldErrors.nameId}
            onChange={(value) => {
              setNameId(value);
              clearFieldError("nameId");
            }}
          />
          <AdminFormField
            id="course-name-en"
            name="nameEn"
            label="English"
            maxLength={200}
            placeholder="Database"
            value={nameEn}
            error={fieldErrors.nameEn}
            onChange={(value) => {
              setNameEn(value);
              clearFieldError("nameEn");
            }}
          />
        </div>
      </AdminFormRow>
    </AdminForm>
  );
}
