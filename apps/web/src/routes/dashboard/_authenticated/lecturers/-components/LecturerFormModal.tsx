import { useState } from "react";
import {
  AdminForm,
  AdminFormField,
  AdminFormModal,
} from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import { lecturerFieldsSchema, type LecturerFieldsInput } from "../-shared/schemas";
import type { AdminLecturer } from "./AdminLecturerRow";

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
    <AdminFormModal
      open={open}
      pending={pending}
      contentClassName="max-w-[440px]"
      onClose={onClose}
    >
      <LecturerFormBody
        key={lecturer?.id ?? "new"}
        lecturer={lecturer}
        pending={pending}
        error={error}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AdminFormModal>
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
  const [name, setName] = useState(lecturer?.name ?? "");
  const [nameError, setNameError] = useState<string | undefined>();
  const editing = lecturer !== null;

  return (
    <AdminForm
      title={editing ? "Edit lecturer" : "Add lecturer"}
      submitLabel={editing ? "Save changes" : "Add lecturer"}
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={() => {
        const parsed = lecturerFieldsSchema.safeParse({ name });
        if (!parsed.success) {
          setNameError(parsed.error.issues[0]?.message);
          return false;
        }
        setNameError(undefined);
        onSubmit(parsed.data);
      }}
    >
      <AdminFormField
        id="lecturer-name"
        name="name"
        label="Full name"
        maxLength={120}
        placeholder="e.g. Ahmad Ashari"
        value={name}
        error={nameError}
        onChange={(value) => {
          setName(value);
          setNameError(undefined);
        }}
      />
    </AdminForm>
  );
}
