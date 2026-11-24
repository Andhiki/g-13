import { useState } from "react";
import * as AlignSwitch from "@/ui/switch";
import {
  AdminForm,
  AdminFormField,
  AdminFormModal,
} from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import { Typography } from "@/ui/typography";
import { announcementFieldsSchema, type AnnouncementFieldsInput } from "../-shared/schemas";
import type { AdminAnnouncement } from "./AdminAnnouncementRow";

type FieldErrors = Partial<Record<keyof AnnouncementFieldsInput, string>>;

function toDatetimeLocalValue(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDatetimeLocal(value: string, now: number): number | null {
  if (value === "") return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : now;
}

export function AnnouncementFormModal({
  open,
  announcement,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  announcement: AdminAnnouncement | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: AnnouncementFieldsInput) => void;
}) {
  return (
    <AdminFormModal open={open} pending={pending} onClose={onClose}>
      <AnnouncementFormBody
        key={announcement?.id ?? "new"}
        announcement={announcement}
        pending={pending}
        error={error}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AdminFormModal>
  );
}

function parseAnnouncementFields(values: {
  slug: string;
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  ctaHref: string;
  ctaLabelId: string;
  ctaLabelEn: string;
  startsAtRaw: string;
  endsAtRaw: string;
  enabled: boolean;
}) {
  const now = Date.now();
  const parsed = announcementFieldsSchema.safeParse({
    slug: values.slug,
    titleId: values.titleId,
    titleEn: values.titleEn,
    bodyId: values.bodyId,
    bodyEn: values.bodyEn,
    ctaHref: values.ctaHref,
    ctaLabelId: values.ctaLabelId,
    ctaLabelEn: values.ctaLabelEn,
    startsAt: parseDatetimeLocal(values.startsAtRaw, now) ?? now,
    endsAt: parseDatetimeLocal(values.endsAtRaw, now),
    enabled: values.enabled,
  });
  if (parsed.success) return { ok: true as const, data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof AnnouncementFieldsInput | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false as const, errors };
}

function AnnouncementTextFields({
  editing,
  slug,
  titleId,
  titleEn,
  bodyId,
  bodyEn,
  fieldErrors,
  onSlugChange,
  onTitleIdChange,
  onTitleEnChange,
  onBodyIdChange,
  onBodyEnChange,
}: {
  editing: boolean;
  slug: string;
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  fieldErrors: FieldErrors;
  onSlugChange: (value: string) => void;
  onTitleIdChange: (value: string) => void;
  onTitleEnChange: (value: string) => void;
  onBodyIdChange: (value: string) => void;
  onBodyEnChange: (value: string) => void;
}) {
  return (
    <>
      <AdminFormField
        id="announcement-slug"
        name="slug"
        label={editing ? "Slug" : "Slug (optional)"}
        maxLength={80}
        placeholder={editing ? "e.g. midterm-schedule" : "Auto-generated from the title if empty"}
        value={slug}
        error={fieldErrors.slug}
        onChange={onSlugChange}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="announcement-title-id"
          name="titleId"
          label="Title (Indonesian)"
          maxLength={120}
          placeholder="e.g. Jadwal UTS"
          value={titleId}
          error={fieldErrors.titleId}
          onChange={onTitleIdChange}
        />
        <AdminFormField
          id="announcement-title-en"
          name="titleEn"
          label="Title (English)"
          maxLength={120}
          placeholder="e.g. Midterm schedule"
          value={titleEn}
          error={fieldErrors.titleEn}
          onChange={onTitleEnChange}
        />
      </div>
      <AdminFormField
        id="announcement-body-id"
        name="bodyId"
        label="Message (Indonesian)"
        maxLength={280}
        placeholder="Jadwal UTS sudah terbit, cek arsip ujian."
        value={bodyId}
        error={fieldErrors.bodyId}
        onChange={onBodyIdChange}
      />
      <AdminFormField
        id="announcement-body-en"
        name="bodyEn"
        label="Message (English)"
        maxLength={280}
        placeholder="Midterm schedule is out, check the exam archive."
        value={bodyEn}
        error={fieldErrors.bodyEn}
        onChange={onBodyEnChange}
      />
    </>
  );
}

function AnnouncementScheduleAndCtaFields({
  ctaHref,
  ctaLabelId,
  ctaLabelEn,
  startsAtRaw,
  endsAtRaw,
  enabled,
  fieldErrors,
  onCtaHrefChange,
  onCtaLabelIdChange,
  onCtaLabelEnChange,
  onStartsAtChange,
  onEndsAtChange,
  onEnabledChange,
}: {
  ctaHref: string;
  ctaLabelId: string;
  ctaLabelEn: string;
  startsAtRaw: string;
  endsAtRaw: string;
  enabled: boolean;
  fieldErrors: FieldErrors;
  onCtaHrefChange: (value: string) => void;
  onCtaLabelIdChange: (value: string) => void;
  onCtaLabelEnChange: (value: string) => void;
  onStartsAtChange: (value: string) => void;
  onEndsAtChange: (value: string) => void;
  onEnabledChange: (checked: boolean) => void;
}) {
  return (
    <>
      <AdminFormField
        id="announcement-cta-href"
        name="ctaHref"
        label="CTA link (optional)"
        maxLength={500}
        placeholder="https://example.com or /exam"
        value={ctaHref}
        error={fieldErrors.ctaHref}
        onChange={onCtaHrefChange}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="announcement-cta-label-id"
          name="ctaLabelId"
          label="CTA label (Indonesian, optional)"
          maxLength={60}
          placeholder="Selengkapnya"
          value={ctaLabelId}
          error={fieldErrors.ctaLabelId}
          onChange={onCtaLabelIdChange}
        />
        <AdminFormField
          id="announcement-cta-label-en"
          name="ctaLabelEn"
          label="CTA label (English, optional)"
          maxLength={60}
          placeholder="Learn more"
          value={ctaLabelEn}
          error={fieldErrors.ctaLabelEn}
          onChange={onCtaLabelEnChange}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="announcement-starts-at"
          name="startsAt"
          type="datetime-local"
          label="Start date"
          maxLength={32}
          placeholder=""
          value={startsAtRaw}
          error={fieldErrors.startsAt}
          onChange={onStartsAtChange}
        />
        <AdminFormField
          id="announcement-ends-at"
          name="endsAt"
          type="datetime-local"
          label="Expiry date (optional)"
          maxLength={32}
          placeholder=""
          value={endsAtRaw}
          error={fieldErrors.endsAt}
          onChange={onEndsAtChange}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Typography as="label" htmlFor="announcement-enabled" variant="labelSmall">
          Enabled
        </Typography>
        <AlignSwitch.Root
          id="announcement-enabled"
          name="enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>
    </>
  );
}

function AnnouncementFormBody({
  announcement,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  announcement: AdminAnnouncement | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: AnnouncementFieldsInput) => void;
}) {
  const [slug, setSlug] = useState(announcement?.slug ?? "");
  const [titleId, setTitleId] = useState(announcement?.titleId ?? "");
  const [titleEn, setTitleEn] = useState(announcement?.titleEn ?? "");
  const [bodyId, setBodyId] = useState(announcement?.bodyId ?? "");
  const [bodyEn, setBodyEn] = useState(announcement?.bodyEn ?? "");
  const [ctaHref, setCtaHref] = useState(announcement?.ctaHref ?? "");
  const [ctaLabelId, setCtaLabelId] = useState(announcement?.ctaLabelId ?? "");
  const [ctaLabelEn, setCtaLabelEn] = useState(announcement?.ctaLabelEn ?? "");
  const [startsAtRaw, setStartsAtRaw] = useState(
    announcement ? toDatetimeLocalValue(announcement.startsAt.getTime()) : "",
  );
  const [endsAtRaw, setEndsAtRaw] = useState(
    announcement?.endsAt ? toDatetimeLocalValue(announcement.endsAt.getTime()) : "",
  );
  const [enabled, setEnabled] = useState(announcement?.enabled ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const editing = announcement !== null;
  const clearFieldError = (field: keyof AnnouncementFieldsInput) =>
    setFieldErrors((current) => ({ ...current, [field]: undefined }));

  const handleFormSubmit = () => {
    const result = parseAnnouncementFields({
      slug,
      titleId,
      titleEn,
      bodyId,
      bodyEn,
      ctaHref,
      ctaLabelId,
      ctaLabelEn,
      startsAtRaw,
      endsAtRaw,
      enabled,
    });
    if (!result.ok) {
      setFieldErrors(result.errors);
      return false;
    }
    setFieldErrors({});
    onSubmit(result.data);
  };

  return (
    <AdminForm
      title={editing ? "Edit announcement" : "Add announcement"}
      submitLabel={editing ? "Save changes" : "Add announcement"}
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={handleFormSubmit}
    >
      <AnnouncementTextFields
        editing={editing}
        slug={slug}
        titleId={titleId}
        titleEn={titleEn}
        bodyId={bodyId}
        bodyEn={bodyEn}
        fieldErrors={fieldErrors}
        onSlugChange={(value) => {
          setSlug(value);
          clearFieldError("slug");
        }}
        onTitleIdChange={(value) => {
          setTitleId(value);
          clearFieldError("titleId");
        }}
        onTitleEnChange={(value) => {
          setTitleEn(value);
          clearFieldError("titleEn");
        }}
        onBodyIdChange={(value) => {
          setBodyId(value);
          clearFieldError("bodyId");
        }}
        onBodyEnChange={(value) => {
          setBodyEn(value);
          clearFieldError("bodyEn");
        }}
      />
      <AnnouncementScheduleAndCtaFields
        ctaHref={ctaHref}
        ctaLabelId={ctaLabelId}
        ctaLabelEn={ctaLabelEn}
        startsAtRaw={startsAtRaw}
        endsAtRaw={endsAtRaw}
        enabled={enabled}
        fieldErrors={fieldErrors}
        onCtaHrefChange={(value) => {
          setCtaHref(value);
          clearFieldError("ctaHref");
        }}
        onCtaLabelIdChange={(value) => {
          setCtaLabelId(value);
          clearFieldError("ctaLabelId");
        }}
        onCtaLabelEnChange={(value) => {
          setCtaLabelEn(value);
          clearFieldError("ctaLabelEn");
        }}
        onStartsAtChange={(value) => {
          setStartsAtRaw(value);
          clearFieldError("startsAt");
        }}
        onEndsAtChange={(value) => {
          setEndsAtRaw(value);
          clearFieldError("endsAt");
        }}
        onEnabledChange={setEnabled}
      />
    </AdminForm>
  );
}
