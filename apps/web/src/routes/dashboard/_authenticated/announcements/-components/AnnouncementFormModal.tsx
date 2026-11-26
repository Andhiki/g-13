import { announcementVariants, type AnnouncementVariant } from "@g13/db/schema/announcements";
import { useId, useRef, useState, type ReactNode } from "react";
import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react/radio";
import * as AlignSwitch from "@/ui/switch";
import { DateTimeField, type DateTimeFieldHandle } from "@/ui/date-time-field";
import {
  dateTimePartsToTimestamp,
  EMPTY_DATE_TIME_PARTS,
  hasPartialDateTime,
  timestampToDateTimeParts,
  type DateTimeControlIssue,
  type DateTimeParts,
} from "@/ui/date-time-value";
import {
  AdminForm,
  AdminFormField,
  AdminFormModal,
} from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import { Typography } from "@/ui/typography";
import {
  announcementFieldsSchema,
  announcementFieldsShape,
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
  ANNOUNCEMENT_CTA_LINK_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
  type AnnouncementFieldsInput,
} from "../-shared/schemas";
import type { AdminAnnouncement } from "./AdminAnnouncementRow";
import { AnnouncementPreview } from "./AnnouncementPreview";

const variantLabels = { primary: "Primary", error: "Error", neutral: "Neutral" } satisfies Record<
  AnnouncementVariant,
  string
>;

function AnnouncementVariantField({
  value,
  onChange,
  disabled,
}: {
  value: AnnouncementVariant;
  onChange: (value: AnnouncementVariant) => void;
  disabled: boolean;
}) {
  const labelId = useId();
  return (
    <div className="space-y-1.5">
      <div id={labelId} className="text-label-sm text-text-strong-950">
        Variant
      </div>
      <RadioGroup
        aria-labelledby={labelId}
        name="variant"
        value={value}
        disabled={disabled}
        onValueChange={(value) => {
          const option = announcementVariants.find((candidate) => candidate === value);
          if (option) onChange(option);
        }}
        className="flex flex-wrap gap-2"
      >
        {announcementVariants.map((option) => (
          <Radio
            key={option}
            value={option}
            className="group flex min-h-9 cursor-[var(--interactive-cursor)] items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 text-label-sm text-text-strong-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base data-checked:border-primary-base data-disabled:cursor-default"
          >
            <span
              aria-hidden="true"
              className="grid size-4 shrink-0 place-items-center rounded-full border border-stroke-sub-300 group-data-checked:border-primary-base"
            >
              <RadioIndicator className="size-2 rounded-full bg-primary-base" />
            </span>
            {variantLabels[option]}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}

type FieldErrors = Partial<Record<keyof AnnouncementFieldsInput, string>>;
type DateTimeErrorParts = Partial<
  Record<"startsAt" | "endsAt" | "countdownAt", "date" | "time" | "both">
>;

const announcementFieldKeys = new Set<string>(Object.keys(announcementFieldsShape.shape));

function isAnnouncementFieldKey(key: PropertyKey): key is keyof AnnouncementFieldsInput {
  return typeof key === "string" && announcementFieldKeys.has(key);
}

export function AnnouncementFormModal({
  open,
  announcement,
  pending,
  error,
  onClose,
  onSubmit,
  children,
}: {
  open: boolean;
  children?: ReactNode;
  announcement: AdminAnnouncement | null;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: AnnouncementFieldsInput) => void;
}) {
  return (
    <AdminFormModal
      open={open}
      pending={pending}
      contentClassName="max-w-[900px]"
      onClose={onClose}
    >
      <AnnouncementFormBody
        key={announcement?.id ?? "new"}
        announcement={announcement}
        pending={pending}
        error={error}
        onClose={onClose}
        onSubmit={onSubmit}
      />
      {children}
    </AdminFormModal>
  );
}

function parseAnnouncementFields(values: {
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  ctaHref: string;
  ctaOpenInNewTab: boolean;
  ctaLabelId: string;
  ctaLabelEn: string;
  startsAt: DateTimeParts;
  endsAt: DateTimeParts;
  countdownAt: DateTimeParts;
  startsAtIssue: DateTimeControlIssue | null;
  endsAtIssue: DateTimeControlIssue | null;
  countdownAtIssue: DateTimeControlIssue | null;
  variant: AnnouncementVariant;
  enabled: boolean;
}) {
  const errors: FieldErrors = {};
  const errorParts: DateTimeErrorParts = {};
  const timestamps = {
    startsAt: dateTimePartsToTimestamp(values.startsAt),
    endsAt: dateTimePartsToTimestamp(values.endsAt),
    countdownAt: dateTimePartsToTimestamp(values.countdownAt),
  };
  for (const field of ["startsAt", "endsAt", "countdownAt"] as const) {
    const issue = values[`${field}Issue`];
    if (issue) {
      errors[field] = issue.message;
      errorParts[field] = issue.part;
    } else if (field !== "startsAt" && hasPartialDateTime(values[field])) {
      errors[field] = "Pick a date or clear the time.";
      errorParts[field] = "both";
    } else if (
      field === "countdownAt" &&
      values.countdownAt.date !== null &&
      timestamps.countdownAt === null
    ) {
      errors.countdownAt = "The countdown target must be after Jan 1, 1970.";
      errorParts.countdownAt = "both";
    }
  }

  const parsed = announcementFieldsSchema.safeParse({
    titleId: values.titleId,
    titleEn: values.titleEn,
    bodyId: values.bodyId,
    bodyEn: values.bodyEn,
    ctaHref: values.ctaHref,
    ctaOpenInNewTab: values.ctaOpenInNewTab,
    ctaLabelId: values.ctaLabelId,
    ctaLabelEn: values.ctaLabelEn,
    startsAt: timestamps.startsAt ?? 0,
    endsAt: timestamps.endsAt,
    countdownAt: timestamps.countdownAt,
    enabled: values.enabled,
    variant: values.variant,
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (!key || !isAnnouncementFieldKey(key)) continue;
      if (!errors[key]) errors[key] = issue.message;
    }
  }

  if (Object.keys(errors).length > 0 || !parsed.success) {
    return { ok: false as const, errors, errorParts };
  }
  return { ok: true as const, data: parsed.data };
}

function AnnouncementTextFields({
  titleId,
  titleEn,
  bodyId,
  bodyEn,
  fieldErrors,
  onTitleIdChange,
  onTitleEnChange,
  onBodyIdChange,
  onBodyEnChange,
}: {
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  fieldErrors: FieldErrors;
  onTitleIdChange: (value: string) => void;
  onTitleEnChange: (value: string) => void;
  onBodyIdChange: (value: string) => void;
  onBodyEnChange: (value: string) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="announcement-title-id"
          name="titleId"
          label="Title (Indonesian)"
          maxLength={ANNOUNCEMENT_TITLE_MAX_LENGTH}
          placeholder="e.g. Jadwal UTS"
          value={titleId}
          error={fieldErrors.titleId}
          onChange={onTitleIdChange}
        />
        <AdminFormField
          id="announcement-title-en"
          name="titleEn"
          label="Title (English)"
          maxLength={ANNOUNCEMENT_TITLE_MAX_LENGTH}
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
        maxLength={ANNOUNCEMENT_BODY_MAX_LENGTH}
        placeholder="Jadwal UTS sudah terbit, cek arsip ujian."
        value={bodyId}
        error={fieldErrors.bodyId}
        onChange={onBodyIdChange}
      />
      <AdminFormField
        id="announcement-body-en"
        name="bodyEn"
        label="Message (English)"
        maxLength={ANNOUNCEMENT_BODY_MAX_LENGTH}
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
  ctaOpenInNewTab,
  ctaLabelId,
  ctaLabelEn,
  startsAt,
  endsAt,
  countdownAt,
  enabled,
  pending,
  fieldErrors,
  errorParts,
  startsAtRef,
  endsAtRef,
  countdownAtRef,
  onCtaHrefChange,
  onCtaOpenInNewTabChange,
  onCtaLabelIdChange,
  onCtaLabelEnChange,
  onStartsAtChange,
  onEndsAtChange,
  onCountdownAtChange,
  onStartsAtActivity,
  onEndsAtActivity,
  onCountdownAtActivity,
  onEnabledChange,
}: {
  ctaHref: string;
  ctaOpenInNewTab: boolean;
  ctaLabelId: string;
  ctaLabelEn: string;
  startsAt: DateTimeParts;
  endsAt: DateTimeParts;
  countdownAt: DateTimeParts;
  enabled: boolean;
  pending: boolean;
  fieldErrors: FieldErrors;
  errorParts: DateTimeErrorParts;
  startsAtRef: { current: DateTimeFieldHandle | null };
  endsAtRef: { current: DateTimeFieldHandle | null };
  countdownAtRef: { current: DateTimeFieldHandle | null };
  onCtaHrefChange: (value: string) => void;
  onCtaOpenInNewTabChange: (checked: boolean) => void;
  onCtaLabelIdChange: (value: string) => void;
  onCtaLabelEnChange: (value: string) => void;
  onStartsAtChange: (value: DateTimeParts) => void;
  onEndsAtChange: (value: DateTimeParts) => void;
  onCountdownAtChange: (value: DateTimeParts) => void;
  onStartsAtActivity: () => void;
  onEndsAtActivity: () => void;
  onCountdownAtActivity: () => void;
  onEnabledChange: (checked: boolean) => void;
}) {
  return (
    <>
      <AdminFormField
        id="announcement-cta-href"
        name="ctaHref"
        label="CTA link (optional)"
        maxLength={ANNOUNCEMENT_CTA_LINK_MAX_LENGTH}
        placeholder="https://example.com or /exam"
        value={ctaHref}
        error={fieldErrors.ctaHref}
        onChange={onCtaHrefChange}
      />
      {ctaHref.trim() && (
        <div className="flex items-center justify-between gap-2">
          <Typography as="label" htmlFor="announcement-cta-new-tab" variant="labelSmall">
            Open in new tab
          </Typography>
          <AlignSwitch.Root
            id="announcement-cta-new-tab"
            checked={ctaOpenInNewTab}
            onCheckedChange={onCtaOpenInNewTabChange}
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="announcement-cta-label-id"
          name="ctaLabelId"
          label="CTA label (Indonesian, optional)"
          maxLength={ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH}
          placeholder="Selengkapnya"
          value={ctaLabelId}
          error={fieldErrors.ctaLabelId}
          onChange={onCtaLabelIdChange}
        />
        <AdminFormField
          id="announcement-cta-label-en"
          name="ctaLabelEn"
          label="CTA label (English, optional)"
          maxLength={ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH}
          placeholder="Learn more"
          value={ctaLabelEn}
          error={fieldErrors.ctaLabelEn}
          onChange={onCtaLabelEnChange}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DateTimeField
          ref={startsAtRef}
          id="announcement-starts-at"
          name="startsAt"
          label="Start date"
          value={startsAt}
          required
          disabled={pending}
          error={fieldErrors.startsAt}
          errorPart={errorParts.startsAt}
          onChange={onStartsAtChange}
          onInputActivity={onStartsAtActivity}
        />
        <DateTimeField
          ref={endsAtRef}
          id="announcement-ends-at"
          name="endsAt"
          label="Expiry date (optional)"
          value={endsAt}
          optional
          disabled={pending}
          error={fieldErrors.endsAt}
          errorPart={errorParts.endsAt}
          onChange={onEndsAtChange}
          onInputActivity={onEndsAtActivity}
        />
      </div>
      <DateTimeField
        ref={countdownAtRef}
        id="announcement-countdown-at"
        name="countdownAt"
        label="Countdown target (optional)"
        value={countdownAt}
        optional
        disabled={pending}
        error={fieldErrors.countdownAt}
        errorPart={errorParts.countdownAt}
        onChange={onCountdownAtChange}
        onInputActivity={onCountdownAtActivity}
      />
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
  const [titleId, setTitleId] = useState(announcement?.titleId ?? "");
  const [titleEn, setTitleEn] = useState(announcement?.titleEn ?? "");
  const [bodyId, setBodyId] = useState(announcement?.bodyId ?? "");
  const [bodyEn, setBodyEn] = useState(announcement?.bodyEn ?? "");
  const [ctaHref, setCtaHref] = useState(announcement?.ctaHref ?? "");
  const [ctaOpenInNewTab, setCtaOpenInNewTab] = useState(announcement?.ctaOpenInNewTab ?? false);
  const [ctaLabelId, setCtaLabelId] = useState(announcement?.ctaLabelId ?? "");
  const [ctaLabelEn, setCtaLabelEn] = useState(announcement?.ctaLabelEn ?? "");
  const [startsAt, setStartsAt] = useState<DateTimeParts>(() =>
    timestampToDateTimeParts(announcement ? announcement.startsAt.getTime() : Date.now()),
  );
  const [endsAt, setEndsAt] = useState<DateTimeParts>(() =>
    announcement?.endsAt
      ? timestampToDateTimeParts(announcement.endsAt.getTime())
      : EMPTY_DATE_TIME_PARTS,
  );
  const [countdownAt, setCountdownAt] = useState<DateTimeParts>(() =>
    announcement?.countdownAt
      ? timestampToDateTimeParts(announcement.countdownAt.getTime())
      : EMPTY_DATE_TIME_PARTS,
  );
  const [variant, setVariant] = useState<AnnouncementVariant>(announcement?.variant ?? "primary");
  const [enabled, setEnabled] = useState(announcement?.enabled ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorParts, setErrorParts] = useState<DateTimeErrorParts>({});
  const startsAtRef = useRef<DateTimeFieldHandle>(null);
  const endsAtRef = useRef<DateTimeFieldHandle>(null);
  const countdownAtRef = useRef<DateTimeFieldHandle>(null);

  const editing = announcement !== null;
  const clearFieldError = (field: keyof AnnouncementFieldsInput) =>
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  const clearScheduleError = (field: keyof DateTimeErrorParts) => {
    clearFieldError(field);
    setErrorParts((current) => ({ ...current, [field]: undefined }));
  };

  const handleFormSubmit = () => {
    const result = parseAnnouncementFields({
      titleId,
      titleEn,
      bodyId,
      bodyEn,
      ctaHref,
      ctaOpenInNewTab,
      ctaLabelId,
      ctaLabelEn,
      startsAt,
      endsAt,
      countdownAt,
      startsAtIssue: startsAtRef.current?.getIssue() ?? null,
      endsAtIssue: endsAtRef.current?.getIssue() ?? null,
      countdownAtIssue: countdownAtRef.current?.getIssue() ?? null,
      enabled,
      variant,
    });
    if (!result.ok) {
      setFieldErrors(result.errors);
      setErrorParts(result.errorParts);
      return false;
    }
    setFieldErrors({});
    setErrorParts({});
    onSubmit(result.data);
  };

  return (
    <AdminForm
      title={editing ? "Edit announcement" : "Add announcement"}
      submitLabel={editing ? "Save changes" : "Add announcement"}
      pending={pending}
      error={error}
      beforeFields={
        <AnnouncementPreview
          variant={variant}
          titleId={titleId}
          titleEn={titleEn}
          bodyId={bodyId}
          bodyEn={bodyEn}
          ctaHref={ctaHref}
          ctaOpenInNewTab={ctaOpenInNewTab}
          ctaLabelId={ctaLabelId}
          ctaLabelEn={ctaLabelEn}
          countdownAt={countdownAt}
          startsAt={startsAt}
          endsAt={endsAt}
          enabled={enabled}
        />
      }
      onClose={onClose}
      onSubmit={handleFormSubmit}
    >
      <AnnouncementVariantField value={variant} onChange={setVariant} disabled={pending} />
      <AnnouncementTextFields
        titleId={titleId}
        titleEn={titleEn}
        bodyId={bodyId}
        bodyEn={bodyEn}
        fieldErrors={fieldErrors}
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
        ctaOpenInNewTab={ctaOpenInNewTab}
        ctaLabelId={ctaLabelId}
        ctaLabelEn={ctaLabelEn}
        startsAt={startsAt}
        endsAt={endsAt}
        countdownAt={countdownAt}
        enabled={enabled}
        pending={pending}
        fieldErrors={fieldErrors}
        errorParts={errorParts}
        startsAtRef={startsAtRef}
        endsAtRef={endsAtRef}
        countdownAtRef={countdownAtRef}
        onCtaOpenInNewTabChange={setCtaOpenInNewTab}
        onCtaHrefChange={(value) => {
          setCtaHref(value);
          if (!value.trim()) setCtaOpenInNewTab(false);
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
          setStartsAt(value);
          clearScheduleError("startsAt");
        }}
        onEndsAtChange={(value) => {
          setEndsAt(value);
          clearScheduleError("endsAt");
        }}
        onCountdownAtChange={(value) => {
          setCountdownAt(value);
          clearScheduleError("countdownAt");
        }}
        onStartsAtActivity={() => clearScheduleError("startsAt")}
        onEndsAtActivity={() => clearScheduleError("endsAt")}
        onCountdownAtActivity={() => clearScheduleError("countdownAt")}
        onEnabledChange={setEnabled}
      />
    </AdminForm>
  );
}
