import { Typography } from "@/ui/typography";
import { AdminFormField } from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import {
  type FieldErrors,
  typeOptions,
  languageOptions,
  statusOptions,
  contactChannelOptions,
  SelectField,
  SwitchField,
} from "./ThesisFormFields";

export type BasicField =
  "slug" | "title" | "authorName" | "authorBatch" | "year" | "type" | "language";

export type AbstractField = "abstract" | "abstractEn" | "keywords";
export type ContactField = "repositoryUrl" | "contactChannel" | "contactValue";
export type ConsentField = "consentDate" | "consentSource" | "status";

export function BasicSection({
  editing,
  slug,
  title,
  authorName,
  authorBatch,
  year,
  type,
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
      <SelectField
        id="thesis-language"
        name="language"
        label="Language"
        value={language}
        options={languageOptions}
        error={errors.language}
        onChange={(value) => onChange("language", value)}
      />
    </section>
  );
}

export function AbstractSection({
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
      <AdminFormField
        multiline
        rows={5}
        id="thesis-abstract"
        name="abstract"
        label="Abstract (Indonesian)"
        value={abstract}
        maxLength={50_000}
        placeholder="Paste the abstract as plain text."
        error={errors.abstract}
        onChange={(value) => onChange("abstract", value)}
      />
      <AdminFormField
        multiline
        rows={5}
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

export function ContactSection({
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

export function ConsentSection({
  consentDate,
  consentSource,
  status,
  errors,
  onChange,
}: {
  consentDate: string;
  consentSource: string;
  status: string;
  errors: FieldErrors;
  onChange: (field: ConsentField, value: string) => void;
}) {
  return (
    <section className="space-y-4">
      <Typography as="h3" variant="label" className="m-0">
        Consent and status
      </Typography>
      <AdminFormField
        id="thesis-consent-date"
        name="consentDate"
        label="Author consent date"
        type="date"
        maxLength={10}
        placeholder=""
        value={consentDate}
        error={errors.consentDate}
        onChange={(value) => onChange("consentDate", value)}
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
