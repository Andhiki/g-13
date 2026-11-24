import { useState, type Dispatch, type SetStateAction } from "react";
import { RiAddLine, RiArrowDownLine, RiArrowUpLine, RiDeleteBinLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import * as AlignSwitch from "@/ui/switch";
import { Typography } from "@/ui/typography";
import {
  AdminForm,
  AdminFormField,
  AdminFormModal,
} from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import {
  createThesisSchema,
  thesisContactChannelSchema,
  thesisLanguageSchema,
  thesisStatusSchema,
  thesisTypeSchema,
  type CreateThesisInput,
  type ThesisLanguage,
  type ThesisStatus,
  type ThesisType,
} from "../-shared/schemas";
import type { AdminThesis } from "./AdminThesisRow";

type LecturerOption = { id: string; name: string };
type SupervisorDraft = {
  key: string;
  lecturerId: string;
  name: string;
  role: "main" | "co" | "";
};
type FieldErrors = Record<string, string | undefined>;

const fieldControlClass =
  "block min-h-9 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-base text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus:outline-none sm:text-paragraph-sm";

const textAreaClass = `${fieldControlClass} min-h-28 resize-y`;

const typeOptions = thesisTypeSchema.options.map((value) => ({
  value,
  label:
    value === "skripsi"
      ? "Skripsi"
      : value === "product-innovation"
        ? "Product innovation"
        : value === "collaborative-project"
          ? "Collaborative project"
          : value === "industry-project"
            ? "Industry project"
            : "Scientific publication",
}));

const languageOptions = thesisLanguageSchema.options.map((value) => ({
  value,
  label: value === "id" ? "Indonesian" : "English",
}));

const statusOptions = thesisStatusSchema.options.map((value) => ({
  value,
  label: value === "draft" ? "Draft" : value === "published" ? "Published" : "Hidden",
}));

const supervisorRoleOptions = [
  { value: "", label: "Not specified" },
  { value: "main", label: "Main supervisor" },
  { value: "co", label: "Co-supervisor" },
];

const contactChannelOptions = [
  { value: "none", label: "No public contact" },
  ...thesisContactChannelSchema.options.map((value) => ({
    value,
    label: value === "email" ? "Email" : "URL",
  })),
];

function TextAreaField({
  id,
  name,
  label,
  value,
  placeholder,
  maxLength,
  rows = 5,
  error,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  maxLength: number;
  rows?: number;
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
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
      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={textAreaClass}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <Typography variant="caption" color="danger" id={errorId} className="mt-1.5">
          {error}
        </Typography>
      )}
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  value,
  options,
  error,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
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
      <select
        id={id}
        name={name}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={fieldControlClass}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <Typography variant="caption" color="danger" id={errorId} className="mt-1.5">
          {error}
        </Typography>
      )}
    </div>
  );
}

function SwitchField({
  id,
  label,
  description,
  checked,
  error,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  error?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-10 border border-stroke-soft-200 p-3">
      <div className="min-w-0">
        <Typography as="label" htmlFor={id} variant="labelSmall" color="strong">
          {label}
        </Typography>
        <Typography as="p" variant="caption" color="muted" className="mb-0 mt-1">
          {description}
        </Typography>
        {error && (
          <Typography variant="caption" color="danger" className="mt-1">
            {error}
          </Typography>
        )}
      </div>
      <AlignSwitch.Root
        id={id}
        checked={checked}
        aria-invalid={Boolean(error)}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function newSupervisor(): SupervisorDraft {
  return { key: crypto.randomUUID(), lecturerId: "", name: "", role: "" };
}

function supervisorDrafts(thesis: AdminThesis | null): SupervisorDraft[] {
  if (!thesis || thesis.supervisors.length === 0) return [newSupervisor()];
  return thesis.supervisors.map((supervisor) => ({
    key: crypto.randomUUID(),
    lecturerId: supervisor.lecturerId ?? "",
    name: supervisor.name,
    role: supervisor.role ?? "",
  }));
}

function splitKeywords(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  ];
}

function SupervisorEditor({
  supervisors,
  lecturers,
  errors,
  onChange,
  onMove,
  onRemove,
  onAdd,
}: {
  supervisors: SupervisorDraft[];
  lecturers: LecturerOption[];
  errors: FieldErrors;
  onChange: (index: number, patch: Partial<SupervisorDraft>) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Typography as="h3" variant="label" className="m-0">
            Supervisors
          </Typography>
          <Typography as="p" variant="caption" color="muted" className="mb-0 mt-1">
            Order is preserved on the public page. Link a lecturer directory profile when possible.
          </Typography>
        </div>
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="stroke"
          type="button"
          onClick={onAdd}
        >
          <RiAddLine className="size-3.5" />
          Add
        </AlignButton.Root>
      </div>
      {supervisors.map((supervisor, index) => {
        const lecturerValue = supervisor.lecturerId;
        const lecturerOptions = [
          { value: "", label: "No linked lecturer" },
          ...lecturers.map((lecturer) => ({ value: lecturer.id, label: lecturer.name })),
        ];
        if (lecturerValue && !lecturers.some((lecturer) => lecturer.id === lecturerValue)) {
          lecturerOptions.push({
            value: lecturerValue,
            label: `${supervisor.name || lecturerValue} (unavailable)`,
          });
        }
        return (
          <div
            key={supervisor.key}
            className="grid gap-3 rounded-10 border border-stroke-soft-200 p-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_auto]"
          >
            <SelectField
              id={`supervisor-${index}-lecturer`}
              name={`supervisors.${index}.lecturerId`}
              label="Linked lecturer"
              value={lecturerValue}
              options={lecturerOptions}
              error={errors[`supervisors.${index}.lecturerId`]}
              onChange={(value) => {
                const selected = lecturers.find((lecturer) => lecturer.id === value);
                onChange(index, {
                  lecturerId: value,
                  name: supervisor.name || selected?.name || "",
                });
              }}
            />
            <AdminFormField
              id={`supervisor-${index}-name`}
              name={`supervisors.${index}.name`}
              label="Name"
              maxLength={200}
              placeholder="e.g. Dr. Nur Rokhman, S.Si., M.Kom."
              value={supervisor.name}
              error={errors[`supervisors.${index}.name`]}
              onChange={(value) => onChange(index, { name: value })}
            />
            <SelectField
              id={`supervisor-${index}-role`}
              name={`supervisors.${index}.role`}
              label="Role"
              value={supervisor.role}
              options={supervisorRoleOptions}
              error={errors[`supervisors.${index}.role`]}
              onChange={(value) =>
                onChange(index, { role: value === "main" || value === "co" ? value : "" })
              }
            />
            <div className="flex items-end justify-end gap-1 pb-0.5">
              <AlignButton.Root
                size="xxsmall"
                variant="neutral"
                mode="ghost"
                type="button"
                iconOnly
                aria-label={`Move supervisor ${index + 1} up`}
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
              >
                <RiArrowUpLine className="size-3.5" />
              </AlignButton.Root>
              <AlignButton.Root
                size="xxsmall"
                variant="neutral"
                mode="ghost"
                type="button"
                iconOnly
                aria-label={`Move supervisor ${index + 1} down`}
                disabled={index === supervisors.length - 1}
                onClick={() => onMove(index, 1)}
              >
                <RiArrowDownLine className="size-3.5" />
              </AlignButton.Root>
              <AlignButton.Root
                size="xxsmall"
                variant="error"
                mode="ghost"
                type="button"
                iconOnly
                aria-label={`Remove supervisor ${index + 1}`}
                disabled={supervisors.length === 1}
                onClick={() => onRemove(index)}
              >
                <RiDeleteBinLine className="size-3.5" />
              </AlignButton.Root>
            </div>
          </div>
        );
      })}
    </section>
  );
}

type BasicField =
  "slug" | "title" | "authorName" | "authorBatch" | "year" | "type" | "field" | "language";

type AbstractField = "abstract" | "abstractEn" | "keywords";
type ContactField = "repositoryUrl" | "contactChannel" | "contactValue";
type ConsentField = "consentSource" | "status";

function BasicSection({
  editing,
  slug,
  title,
  authorName,
  authorBatch,
  year,
  type,
  field,
  language,
  errors,
  onChange,
}: {
  editing: boolean;
  slug: string;
  title: string;
  authorName: string;
  authorBatch: string;
  year: string;
  type: string;
  field: string;
  language: string;
  errors: FieldErrors;
  onChange: (field: BasicField, value: string) => void;
}) {
  return (
    <section className="space-y-4">
      <AdminFormField
        id="thesis-slug"
        name="slug"
        label={editing ? "Slug" : "Slug (optional)"}
        maxLength={120}
        placeholder={
          editing ? "Slug is permanent" : "Auto-generated from the title and year if empty"
        }
        value={slug}
        readOnly={editing}
        error={errors.slug}
        onChange={(value) => onChange("slug", value)}
      />
      <AdminFormField
        id="thesis-title"
        name="title"
        label="Title"
        maxLength={300}
        placeholder="Thesis title"
        value={title}
        error={errors.title}
        onChange={(value) => onChange("title", value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="thesis-author"
          name="authorName"
          label="Author name"
          maxLength={200}
          placeholder="e.g. Ayu Contoh"
          value={authorName}
          error={errors.authorName}
          onChange={(value) => onChange("authorName", value)}
        />
        <AdminFormField
          id="thesis-author-batch"
          name="authorBatch"
          label="Batch (optional)"
          maxLength={4}
          placeholder="e.g. 2022"
          value={authorBatch}
          error={errors.authorBatch}
          onChange={(value) => onChange("authorBatch", value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="thesis-year"
          name="year"
          label="Year"
          maxLength={4}
          placeholder="e.g. 2026"
          value={year}
          error={errors.year}
          onChange={(value) => onChange("year", value)}
        />
        <SelectField
          id="thesis-type"
          name="type"
          label="Type"
          value={type}
          options={typeOptions}
          error={errors.type}
          onChange={(value) => onChange("type", value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField
          id="thesis-field"
          name="field"
          label="Peminatan (optional)"
          maxLength={120}
          placeholder="e.g. Sistem Cerdas"
          value={field}
          error={errors.field}
          onChange={(value) => onChange("field", value)}
        />
        <SelectField
          id="thesis-language"
          name="language"
          label="Language"
          value={language}
          options={languageOptions}
          error={errors.language}
          onChange={(value) => onChange("language", value)}
        />
      </div>
    </section>
  );
}

function AbstractSection({
  abstract,
  abstractEn,
  keywords,
  abstractPublic,
  errors,
  onChange,
  onAbstractPublicChange,
}: {
  abstract: string;
  abstractEn: string;
  keywords: string;
  abstractPublic: boolean;
  errors: FieldErrors;
  onChange: (field: AbstractField, value: string) => void;
  onAbstractPublicChange: (checked: boolean) => void;
}) {
  return (
    <section className="space-y-4">
      <Typography as="h3" variant="label" className="m-0">
        Abstract and keywords
      </Typography>
      <TextAreaField
        id="thesis-abstract"
        name="abstract"
        label="Abstract (Indonesian)"
        value={abstract}
        maxLength={50_000}
        placeholder="Paste the abstract as plain text."
        error={errors.abstract}
        onChange={(value) => onChange("abstract", value)}
      />
      <TextAreaField
        id="thesis-abstract-en"
        name="abstractEn"
        label="Abstract (English, optional)"
        value={abstractEn}
        maxLength={50_000}
        placeholder="Paste the English abstract when available."
        error={errors.abstractEn}
        onChange={(value) => onChange("abstractEn", value)}
      />
      <AdminFormField
        id="thesis-keywords"
        name="keywords"
        label="Keywords (comma-separated)"
        maxLength={2_000}
        placeholder="e.g. machine learning, evaluasi, prediksi"
        value={keywords}
        error={errors.keywords}
        onChange={(value) => onChange("keywords", value)}
      />
      <SwitchField
        id="thesis-abstract-public"
        label="Publish abstract"
        description="Only enable after the author has consented. The abstract stays hidden otherwise."
        checked={abstractPublic}
        error={errors.abstractPublic}
        onCheckedChange={onAbstractPublicChange}
      />
    </section>
  );
}

function ContactSection({
  repositoryUrl,
  contactChannel,
  contactValue,
  contactPublic,
  errors,
  onChange,
  onContactPublicChange,
}: {
  repositoryUrl: string;
  contactChannel: string;
  contactValue: string;
  contactPublic: boolean;
  errors: FieldErrors;
  onChange: (field: ContactField, value: string) => void;
  onContactPublicChange: (checked: boolean) => void;
}) {
  return (
    <section className="space-y-4">
      <Typography as="h3" variant="label" className="m-0">
        Full text and contact
      </Typography>
      <AdminFormField
        id="thesis-repository-url"
        name="repositoryUrl"
        label="Repository or ETD link (optional)"
        maxLength={500}
        placeholder="https://…"
        value={repositoryUrl}
        error={errors.repositoryUrl}
        onChange={(value) => onChange("repositoryUrl", value)}
      />
      <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <SelectField
          id="thesis-contact-channel"
          name="contactChannel"
          label="Public contact"
          value={contactChannel}
          options={contactChannelOptions}
          error={errors.contactChannel}
          onChange={(value) => onChange("contactChannel", value)}
        />
        <AdminFormField
          id="thesis-contact-value"
          name="contactValue"
          label="Contact value"
          maxLength={300}
          placeholder="author@example.com or https://…"
          value={contactValue}
          error={errors.contactValue}
          onChange={(value) => onChange("contactValue", value)}
        />
      </div>
      <SwitchField
        id="thesis-contact-public"
        label="Show contact"
        description="Only enable after the author has consented to publish this contact."
        checked={contactPublic}
        error={errors.contactPublic}
        onCheckedChange={onContactPublicChange}
      />
    </section>
  );
}

function ConsentSection({
  consentRecorded,
  consentSource,
  status,
  errors,
  onChange,
  onConsentRecordedChange,
}: {
  consentRecorded: boolean;
  consentSource: string;
  status: string;
  errors: FieldErrors;
  onChange: (field: ConsentField, value: string) => void;
  onConsentRecordedChange: (checked: boolean) => void;
}) {
  return (
    <section className="space-y-4">
      <Typography as="h3" variant="label" className="m-0">
        Consent and status
      </Typography>
      <SwitchField
        id="thesis-consent-recorded"
        label="Author consent recorded"
        description="Required before publishing the thesis, abstract, or contact."
        checked={consentRecorded}
        error={errors.consentRecorded}
        onCheckedChange={onConsentRecordedChange}
      />
      <AdminFormField
        id="thesis-consent-source"
        name="consentSource"
        label="Consent source"
        maxLength={500}
        placeholder="GitHub issue URL or private note reference"
        value={consentSource}
        error={errors.consentSource}
        onChange={(value) => onChange("consentSource", value)}
      />
      <SelectField
        id="thesis-status"
        name="status"
        label="Status"
        value={status}
        options={statusOptions}
        error={errors.status}
        onChange={(value) => onChange("status", value)}
      />
      <Typography as="p" variant="caption" color="muted" className="m-0">
        Publishing requires the title, author, year, at least one supervisor, and recorded consent.
      </Typography>
    </section>
  );
}

function useThesisFormHandlers({
  setSlug,
  setTitle,
  setAuthorName,
  setAuthorBatch,
  setYear,
  setType,
  setField,
  setLanguage,
  setAbstract,
  setAbstractEn,
  setKeywords,
  setRepositoryUrl,
  setContactChannel,
  setContactValue,
  setAbstractPublic,
  setContactPublic,
  setConsentRecorded,
  setConsentSource,
  setStatus,
  setSupervisors,
  clearFieldError,
}: {
  setSlug: (value: string) => void;
  setTitle: (value: string) => void;
  setAuthorName: (value: string) => void;
  setAuthorBatch: (value: string) => void;
  setYear: (value: string) => void;
  setType: (value: ThesisType) => void;
  setField: (value: string) => void;
  setLanguage: (value: ThesisLanguage) => void;
  setAbstract: (value: string) => void;
  setAbstractEn: (value: string) => void;
  setKeywords: (value: string) => void;
  setRepositoryUrl: (value: string) => void;
  setContactChannel: (value: "email" | "url" | "none") => void;
  setContactValue: (value: string) => void;
  setAbstractPublic: (value: boolean) => void;
  setContactPublic: (value: boolean) => void;
  setConsentRecorded: (value: boolean) => void;
  setConsentSource: (value: string) => void;
  setStatus: (value: ThesisStatus) => void;
  setSupervisors: Dispatch<SetStateAction<SupervisorDraft[]>>;
  clearFieldError: (key: string) => void;
}) {
  const handleBasicChange = (fieldName: BasicField, value: string) => {
    switch (fieldName) {
      case "slug":
        setSlug(value);
        break;
      case "title":
        setTitle(value);
        break;
      case "authorName":
        setAuthorName(value);
        break;
      case "authorBatch":
        setAuthorBatch(value);
        break;
      case "year":
        setYear(value);
        break;
      case "type":
        setType(value as ThesisType);
        break;
      case "field":
        setField(value);
        break;
      case "language":
        setLanguage(value as ThesisLanguage);
        break;
    }
    clearFieldError(fieldName);
  };

  const handleAbstractChange = (fieldName: AbstractField, value: string) => {
    if (fieldName === "abstract") setAbstract(value);
    else if (fieldName === "abstractEn") setAbstractEn(value);
    else setKeywords(value);
    clearFieldError(fieldName);
  };

  const handleContactChange = (fieldName: ContactField, value: string) => {
    if (fieldName === "repositoryUrl") setRepositoryUrl(value);
    else if (fieldName === "contactChannel") setContactChannel(value as "email" | "url" | "none");
    else setContactValue(value);
    clearFieldError(fieldName);
  };

  const handleConsentChange = (fieldName: ConsentField, value: string) => {
    if (fieldName === "consentSource") setConsentSource(value);
    else setStatus(value as ThesisStatus);
    clearFieldError(fieldName);
  };

  const changeSupervisor = (index: number, patch: Partial<SupervisorDraft>) => {
    setSupervisors((current) =>
      current.map((supervisor, currentIndex) =>
        currentIndex === index ? { ...supervisor, ...patch } : supervisor,
      ),
    );
    clearFieldError(`supervisors.${index}.name`);
    clearFieldError(`supervisors.${index}.lecturerId`);
  };

  const moveSupervisor = (index: number, direction: -1 | 1) => {
    setSupervisors((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const removeSupervisor = (index: number) => {
    setSupervisors((current) =>
      current.length <= 1 ? current : current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const addSupervisor = () => setSupervisors((current) => [...current, newSupervisor()]);

  const changeAbstractPublic = (checked: boolean) => {
    setAbstractPublic(checked);
    clearFieldError("abstractPublic");
  };

  const changeContactPublic = (checked: boolean) => {
    setContactPublic(checked);
    clearFieldError("contactPublic");
  };

  const changeConsentRecorded = (checked: boolean) => {
    setConsentRecorded(checked);
    clearFieldError("consentRecorded");
  };

  return {
    handleBasicChange,
    handleAbstractChange,
    handleContactChange,
    handleConsentChange,
    changeSupervisor,
    moveSupervisor,
    removeSupervisor,
    addSupervisor,
    changeAbstractPublic,
    changeContactPublic,
    changeConsentRecorded,
  };
}

export function ThesisFormModal({
  open,
  thesis,
  lecturers,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  thesis: AdminThesis | null;
  lecturers: LecturerOption[];
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CreateThesisInput) => void;
}) {
  return (
    <AdminFormModal
      open={open}
      pending={pending}
      contentClassName="max-w-[760px]"
      onClose={onClose}
    >
      <ThesisFormBody
        key={thesis?.id ?? "new"}
        thesis={thesis}
        lecturers={lecturers}
        pending={pending}
        error={error}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AdminFormModal>
  );
}

function ThesisFormBody({
  thesis,
  lecturers,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  thesis: AdminThesis | null;
  lecturers: LecturerOption[];
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CreateThesisInput) => void;
}) {
  const editing = thesis !== null;
  const [slug, setSlug] = useState(thesis?.id ?? "");
  const [title, setTitle] = useState(thesis?.title ?? "");
  const [authorName, setAuthorName] = useState(thesis?.authorName ?? "");
  const [authorBatch, setAuthorBatch] = useState(
    thesis?.authorBatch !== null && thesis?.authorBatch !== undefined
      ? String(thesis.authorBatch)
      : "",
  );
  const [year, setYear] = useState(thesis ? String(thesis.year) : "");
  const [type, setType] = useState(thesis?.type ?? "skripsi");
  const [field, setField] = useState(thesis?.field ?? "");
  const [language, setLanguage] = useState(thesis?.language ?? "id");
  const [abstract, setAbstract] = useState(thesis?.abstract ?? "");
  const [abstractEn, setAbstractEn] = useState(thesis?.abstractEn ?? "");
  const [keywords, setKeywords] = useState((thesis?.keywords ?? []).join(", "));
  const [repositoryUrl, setRepositoryUrl] = useState(thesis?.repositoryUrl ?? "");
  const [contactChannel, setContactChannel] = useState(thesis?.contactChannel ?? "none");
  const [contactValue, setContactValue] = useState(thesis?.contactValue ?? "");
  const [abstractPublic, setAbstractPublic] = useState(thesis?.abstractPublic ?? false);
  const [contactPublic, setContactPublic] = useState(thesis?.contactPublic ?? false);
  const [consentRecorded, setConsentRecorded] = useState(
    thesis ? thesis.consentAt !== null : false,
  );
  const [consentSource, setConsentSource] = useState(thesis?.consentSource ?? "");
  const [status, setStatus] = useState(thesis?.status ?? "draft");
  const [supervisors, setSupervisors] = useState<SupervisorDraft[]>(() => supervisorDrafts(thesis));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();

  const clearFieldError = (key: string) => {
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(undefined);
  };

  const {
    handleBasicChange,
    handleAbstractChange,
    handleContactChange,
    handleConsentChange,
    changeSupervisor,
    moveSupervisor,
    removeSupervisor,
    addSupervisor,
    changeAbstractPublic,
    changeContactPublic,
    changeConsentRecorded,
  } = useThesisFormHandlers({
    setSlug,
    setTitle,
    setAuthorName,
    setAuthorBatch,
    setYear,
    setType,
    setField,
    setLanguage,
    setAbstract,
    setAbstractEn,
    setKeywords,
    setRepositoryUrl,
    setContactChannel,
    setContactValue,
    setAbstractPublic,
    setContactPublic,
    setConsentRecorded,
    setConsentSource,
    setStatus,
    setSupervisors,
    clearFieldError,
  });

  const handleSubmit = () => {
    const parsed = createThesisSchema.safeParse({
      slug: editing ? undefined : slug,
      title,
      authorName,
      authorBatch: authorBatch.trim() === "" ? null : Number(authorBatch),
      year: Number(year),
      type,
      field: field.trim() || null,
      language,
      abstract: abstract.trim() || null,
      abstractEn: abstractEn.trim() || null,
      keywords: splitKeywords(keywords),
      repositoryUrl: repositoryUrl.trim() || null,
      contactChannel: contactChannel === "none" ? null : contactChannel,
      contactValue: contactValue.trim() || null,
      abstractPublic,
      contactPublic,
      consentRecorded,
      consentSource: consentSource.trim() || null,
      status,
      supervisors: supervisors.map((supervisor) => ({
        lecturerId: supervisor.lecturerId || null,
        name: supervisor.name,
        role: supervisor.role === "main" || supervisor.role === "co" ? supervisor.role : null,
      })),
    });
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      let firstError: string | undefined;
      for (const issue of parsed.error.issues) {
        const path = issue.path.map(String).join(".");
        if (path.startsWith("supervisors.")) {
          nextErrors[path] = issue.message;
          firstError ??= issue.message;
        } else {
          const key = String(issue.path[0] ?? "form");
          nextErrors[key] ??= issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setFormError(firstError ?? parsed.error.issues[0]?.message ?? "Check the fields below.");
      return false;
    }
    setFieldErrors({});
    setFormError(undefined);
    onSubmit(parsed.data);
    return true;
  };

  return (
    <AdminForm
      title={editing ? "Edit thesis" : "Add thesis"}
      submitLabel={editing ? "Save changes" : "Add thesis"}
      pending={pending}
      error={formError ?? error}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <BasicSection
        editing={editing}
        slug={slug}
        title={title}
        authorName={authorName}
        authorBatch={authorBatch}
        year={year}
        type={type}
        field={field}
        language={language}
        errors={fieldErrors}
        onChange={handleBasicChange}
      />
      <SupervisorEditor
        supervisors={supervisors}
        lecturers={lecturers}
        errors={fieldErrors}
        onChange={changeSupervisor}
        onMove={moveSupervisor}
        onRemove={removeSupervisor}
        onAdd={addSupervisor}
      />
      <AbstractSection
        abstract={abstract}
        abstractEn={abstractEn}
        keywords={keywords}
        abstractPublic={abstractPublic}
        errors={fieldErrors}
        onChange={handleAbstractChange}
        onAbstractPublicChange={changeAbstractPublic}
      />
      <ContactSection
        repositoryUrl={repositoryUrl}
        contactChannel={contactChannel}
        contactValue={contactValue}
        contactPublic={contactPublic}
        errors={fieldErrors}
        onChange={handleContactChange}
        onContactPublicChange={changeContactPublic}
      />
      <ConsentSection
        consentRecorded={consentRecorded}
        consentSource={consentSource}
        status={status}
        errors={fieldErrors}
        onChange={handleConsentChange}
        onConsentRecordedChange={changeConsentRecorded}
      />
    </AdminForm>
  );
}
