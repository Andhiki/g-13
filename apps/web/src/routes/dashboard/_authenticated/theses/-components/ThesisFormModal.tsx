import { useState } from "react";
import {
  AdminForm,
  AdminFormModal,
} from "@/routes/dashboard/_authenticated/-components/AdminFormModal";
import { type CreateThesisInput } from "../-shared/schemas";
import type { AdminThesis } from "./AdminThesisRow";
import {
  type LecturerOption,
  type FieldOption,
  type SupervisorDraft,
  type FieldErrors,
  FieldsSection,
} from "./ThesisFormFields";
import { supervisorDrafts, SupervisorEditor } from "./ThesisSupervisorEditor";
import {
  BasicSection,
  AbstractSection,
  ContactSection,
  ConsentSection,
} from "./ThesisFormSections";
import { useThesisFormHandlers, parseThesisFormValues } from "./thesis-form-state";

export function ThesisFormModal({
  open,
  thesis,
  lecturers,
  fields,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  thesis: AdminThesis | null;
  lecturers: LecturerOption[];
  fields: FieldOption[];
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CreateThesisInput) => void;
}) {
  return (
    <AdminFormModal
      open={open}
      pending={pending}
      contentClassName="flex max-w-[760px] flex-col overflow-hidden"
      onClose={onClose}
    >
      <ThesisFormBody
        key={thesis?.id ?? "new"}
        thesis={thesis}
        lecturers={lecturers}
        fields={fields}
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
  fields,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  thesis: AdminThesis | null;
  lecturers: LecturerOption[];
  fields: FieldOption[];
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
  const [fieldIds, setFieldIds] = useState(thesis?.fields.map((field) => field.id) ?? []);
  const [language, setLanguage] = useState(thesis?.language ?? "id");
  const [abstract, setAbstract] = useState(thesis?.abstract ?? "");
  const [abstractEn, setAbstractEn] = useState(thesis?.abstractEn ?? "");
  const [keywords, setKeywords] = useState((thesis?.keywords ?? []).join(", "));
  const [repositoryUrl, setRepositoryUrl] = useState(thesis?.repositoryUrl ?? "");
  const [contactChannel, setContactChannel] = useState(thesis?.contactChannel ?? "none");
  const [contactValue, setContactValue] = useState(thesis?.contactValue ?? "");
  const [abstractPublic, setAbstractPublic] = useState(thesis?.abstractPublic ?? false);
  const [contactPublic, setContactPublic] = useState(thesis?.contactPublic ?? false);
  const [consentDate, setConsentDate] = useState(
    thesis?.consentAt?.toISOString().slice(0, 10) ?? "",
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

  const changeFieldIds = (fieldIds: string[]) => {
    setFieldIds(fieldIds);
    clearFieldError("fieldIds");
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
  } = useThesisFormHandlers({
    setSlug,
    setTitle,
    setAuthorName,
    setAuthorBatch,
    setYear,
    setType,
    setLanguage,
    setAbstract,
    setAbstractEn,
    setKeywords,
    setRepositoryUrl,
    setContactChannel,
    setContactValue,
    setAbstractPublic,
    setContactPublic,
    setConsentDate,
    setConsentSource,
    setStatus,
    setSupervisors,
    clearFieldError,
  });

  const handleSubmit = () => {
    const result = parseThesisFormValues({
      editing,
      slug,
      title,
      authorName,
      authorBatch,
      year,
      type,
      fieldIds,
      language,
      abstract,
      abstractEn,
      keywords,
      repositoryUrl,
      contactChannel,
      contactValue,
      abstractPublic,
      contactPublic,
      consentDate,
      consentSource,
      status,
      supervisors,
    });
    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      setFormError(result.formError);
      return false;
    }
    setFieldErrors({});
    setFormError(undefined);
    onSubmit(result.data);
    return true;
  };

  return (
    <AdminForm
      title={editing ? "Edit thesis" : "Add thesis"}
      scrollFields
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
        language={language}
        errors={fieldErrors}
        onChange={handleBasicChange}
      />
      <FieldsSection
        fields={fields}
        selected={fieldIds}
        error={fieldErrors.fieldIds}
        onChange={changeFieldIds}
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
        consentDate={consentDate}
        consentSource={consentSource}
        status={status}
        errors={fieldErrors}
        onChange={handleConsentChange}
      />
    </AdminForm>
  );
}
