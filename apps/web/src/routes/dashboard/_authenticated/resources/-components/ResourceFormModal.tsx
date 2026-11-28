import { useState } from "react";
import { RiExternalLinkLine } from "@remixicon/react";
import {
  AdminForm,
  AdminFormField,
  AdminFormModal,
  AdminFormRow,
} from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import { Typography } from "@/ui/typography";
import {
  RESOURCE_FIELD_LIMITS,
  resourceFieldsSchema,
  resourceUrlSchema,
  type ResourceFieldsInput,
} from "../-shared/schemas";
import type { AdminResource } from "./AdminResourceRow";
import { ResourceFavicon, resourceHost } from "./ResourceFavicon";

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
      contentClassName="max-w-[760px]"
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

  const validateField = (field: keyof ResourceFieldsInput, value: string) => {
    const parsed = resourceFieldsSchema.shape[field].safeParse(value);
    if (field === "url" && parsed.success) setUrl(parsed.data);
    setFieldErrors((current) => ({
      ...current,
      [field]: parsed.success ? undefined : parsed.error.issues[0]?.message,
    }));
  };

  const previewUrl = resourceUrlSchema.safeParse(url);

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
      <div className="divide-y divide-stroke-soft-200 *:space-y-4 *:py-5 *:first:pt-0 *:last:pb-0">
        <section aria-label="Content">
          <AdminFormRow label="Title">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminFormField
                id="resource-title-id"
                name="titleId"
                label="Indonesian"
                maxLength={RESOURCE_FIELD_LIMITS.title}
                showCounter
                placeholder="Arsip ujian HIMAKOM UGM"
                value={titleId}
                error={fieldErrors.titleId}
                onChange={(value) => {
                  setTitleId(value);
                  clearFieldError("titleId");
                }}
                onBlur={() => validateField("titleId", titleId)}
              />
              <AdminFormField
                id="resource-title-en"
                name="titleEn"
                label="English"
                maxLength={RESOURCE_FIELD_LIMITS.title}
                showCounter
                placeholder="HIMAKOM UGM exam archive"
                value={titleEn}
                error={fieldErrors.titleEn}
                onChange={(value) => {
                  setTitleEn(value);
                  clearFieldError("titleEn");
                }}
                onBlur={() => validateField("titleEn", titleEn)}
              />
            </div>
          </AdminFormRow>
          <AdminFormRow label="Description">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminFormField
                id="resource-description-id"
                name="descriptionId"
                label="Indonesian"
                maxLength={RESOURCE_FIELD_LIMITS.description}
                showCounter
                multiline
                placeholder="Jelaskan singkat isi dan manfaat tautan ini."
                value={descriptionId}
                error={fieldErrors.descriptionId}
                onChange={(value) => {
                  setDescriptionId(value);
                  clearFieldError("descriptionId");
                }}
                onBlur={() => validateField("descriptionId", descriptionId)}
              />
              <AdminFormField
                id="resource-description-en"
                name="descriptionEn"
                label="English"
                maxLength={RESOURCE_FIELD_LIMITS.description}
                showCounter
                multiline
                placeholder="Briefly describe what this link offers."
                value={descriptionEn}
                error={fieldErrors.descriptionEn}
                onChange={(value) => {
                  setDescriptionEn(value);
                  clearFieldError("descriptionEn");
                }}
                onBlur={() => validateField("descriptionEn", descriptionEn)}
              />
            </div>
          </AdminFormRow>
        </section>
        <section aria-label="Link">
          <AdminFormRow label="Link" htmlFor="resource-url">
            <div className="space-y-3">
              <AdminFormField
                id="resource-url"
                name="url"
                maxLength={RESOURCE_FIELD_LIMITS.url}
                placeholder="https://example.com"
                inputMode="url"
                autoComplete="url"
                value={url}
                error={fieldErrors.url}
                onChange={(value) => {
                  setUrl(value);
                  clearFieldError("url");
                }}
                onBlur={() => validateField("url", url)}
              />
              {previewUrl.success && (
                <div className="flex items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                  <ResourceFavicon url={previewUrl.data} />
                  <Typography variant="caption" color="strong" className="min-w-0 truncate">
                    {resourceHost(previewUrl.data)}
                  </Typography>
                  <a
                    href={previewUrl.data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex shrink-0 items-center gap-1 text-label-xs text-primary-base underline-offset-2 hover:underline"
                  >
                    Open link
                    <RiExternalLinkLine aria-hidden="true" className="size-3.5" />
                  </a>
                </div>
              )}
            </div>
          </AdminFormRow>
        </section>
      </div>
    </AdminForm>
  );
}
