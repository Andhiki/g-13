import { useState } from "react";
import {
  AdminForm,
  AdminFormField,
  AdminFormModal,
} from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import { Typography } from "@/ui/typography";
import { resourceFieldsSchema, type ResourceFieldsInput } from "../-shared/schemas";
import type { AdminResource } from "./AdminResourceRow";

type FieldErrors = Partial<Record<keyof ResourceFieldsInput, string>>;

export function ResourceFormModal({
  open,
  resource,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  resource: AdminResource | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: ResourceFieldsInput) => void;
}) {
  return (
    <AdminFormModal
      open={open}
      pending={pending}
      onClose={onClose}
      contentClassName="max-w-[560px]"
    >
      <ResourceFormBody
        key={resource?.id ?? "new"}
        resource={resource}
        pending={pending}
        error={error}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AdminFormModal>
  );
}

function ResourceFormBody({
  resource,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  resource: AdminResource | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: ResourceFieldsInput) => void;
}) {
  const [titleId, setTitleId] = useState(resource?.titleId ?? "");
  const [titleEn, setTitleEn] = useState(resource?.titleEn ?? "");
  const [descriptionId, setDescriptionId] = useState(resource?.descriptionId ?? "");
  const [descriptionEn, setDescriptionEn] = useState(resource?.descriptionEn ?? "");
  const [url, setUrl] = useState(resource?.url ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const editing = resource !== null;
  const clearFieldError = (field: keyof ResourceFieldsInput) =>
    setFieldErrors((current) => ({ ...current, [field]: undefined }));

  const handleFormSubmit = () => {
    const parsed = resourceFieldsSchema.safeParse({
      titleId,
      titleEn,
      descriptionId,
      descriptionEn,
      url,
    });
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ResourceFieldsInput | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return false;
    }
    setFieldErrors({});
    onSubmit(parsed.data);
  };

  return (
    <AdminForm
      title={editing ? "Edit learning resource" : "Add learning resource"}
      submitLabel={editing ? "Save changes" : "Add resource"}
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={handleFormSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="resource-title-id"
          name="titleId"
          label="Title (Indonesian)"
          maxLength={120}
          placeholder="e.g. Arsip ujian HIMAKOM UGM"
          value={titleId}
          error={fieldErrors.titleId}
          onChange={(value) => {
            setTitleId(value);
            clearFieldError("titleId");
          }}
        />
        <AdminFormField
          id="resource-title-en"
          name="titleEn"
          label="Title (English)"
          maxLength={120}
          placeholder="e.g. HIMAKOM UGM exam archive"
          value={titleEn}
          error={fieldErrors.titleEn}
          onChange={(value) => {
            setTitleEn(value);
            clearFieldError("titleEn");
          }}
        />
      </div>
      <AdminFormField
        id="resource-description-id"
        name="descriptionId"
        label="Description (Indonesian)"
        maxLength={400}
        multiline
        placeholder="Jelaskan singkat isi dan manfaat tautan ini."
        value={descriptionId}
        error={fieldErrors.descriptionId}
        onChange={(value) => {
          setDescriptionId(value);
          clearFieldError("descriptionId");
        }}
      />
      <AdminFormField
        id="resource-description-en"
        name="descriptionEn"
        label="Description (English)"
        maxLength={400}
        multiline
        placeholder="Briefly describe what this link offers."
        value={descriptionEn}
        error={fieldErrors.descriptionEn}
        onChange={(value) => {
          setDescriptionEn(value);
          clearFieldError("descriptionEn");
        }}
      />
      <AdminFormField
        id="resource-url"
        name="url"
        label="Link"
        maxLength={500}
        placeholder="https://example.com"
        value={url}
        error={fieldErrors.url}
        onChange={(value) => {
          setUrl(value);
          clearFieldError("url");
        }}
      />
      <Typography variant="caption" color="muted" className="block">
        {editing
          ? "Order is managed by dragging rows on the resources list."
          : "New resources are added to the end; drag rows on the list to change the order."}
      </Typography>
    </AdminForm>
  );
}
