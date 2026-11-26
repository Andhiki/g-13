import { type Dispatch, type SetStateAction } from "react";
import {
  createThesisSchema,
  type CreateThesisInput,
  type ThesisLanguage,
  type ThesisStatus,
  type ThesisType,
} from "../-shared/schemas";
import { type SupervisorDraft, type FieldErrors } from "./ThesisFormFields";
import { newSupervisor } from "./ThesisSupervisorEditor";
import {
  type BasicField,
  type AbstractField,
  type ContactField,
  type ConsentField,
} from "./ThesisFormSections";

export function useThesisFormHandlers({
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
}: {
  setSlug: (value: string) => void;
  setTitle: (value: string) => void;
  setAuthorName: (value: string) => void;
  setAuthorBatch: (value: string) => void;
  setYear: (value: string) => void;
  setType: (value: ThesisType) => void;
  setLanguage: (value: ThesisLanguage) => void;
  setAbstract: (value: string) => void;
  setAbstractEn: (value: string) => void;
  setKeywords: (value: string) => void;
  setRepositoryUrl: (value: string) => void;
  setContactChannel: (value: "email" | "url" | "none") => void;
  setContactValue: (value: string) => void;
  setAbstractPublic: (value: boolean) => void;
  setContactPublic: (value: boolean) => void;
  setConsentDate: (value: string) => void;
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
    if (fieldName === "consentDate") setConsentDate(value);
    else if (fieldName === "consentSource") setConsentSource(value);
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
  };
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

export function parseThesisFormValues({
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
}: {
  editing: boolean;
  slug: string;
  title: string;
  authorName: string;
  authorBatch: string;
  year: string;
  type: string;
  fieldIds: string[];
  language: string;
  abstract: string;
  abstractEn: string;
  keywords: string;
  repositoryUrl: string;
  contactChannel: string;
  contactValue: string;
  abstractPublic: boolean;
  contactPublic: boolean;
  consentDate: string;
  consentSource: string;
  status: string;
  supervisors: SupervisorDraft[];
}):
  | { ok: true; data: CreateThesisInput }
  | { ok: false; fieldErrors: FieldErrors; formError: string } {
  const parsed = createThesisSchema.safeParse({
    slug: editing ? undefined : slug,
    title,
    authorName,
    authorBatch: authorBatch.trim() === "" ? null : Number(authorBatch),
    year: Number(year),
    type,
    fieldIds,
    language,
    abstract: abstract.trim() || null,
    abstractEn: abstractEn.trim() || null,
    keywords: splitKeywords(keywords),
    repositoryUrl: repositoryUrl.trim() || null,
    contactChannel: contactChannel === "none" ? null : contactChannel,
    contactValue: contactValue.trim() || null,
    abstractPublic,
    contactPublic,
    consentDate: consentDate || null,
    consentSource: consentSource.trim() || null,
    status,
    supervisors: supervisors.map((supervisor) => ({
      lecturerId: supervisor.lecturerId || null,
      name: supervisor.name,
      role: supervisor.role === "main" || supervisor.role === "co" ? supervisor.role : null,
    })),
  });
  if (parsed.success) return { ok: true, data: parsed.data };
  const fieldErrors: FieldErrors = {};
  let firstError: string | undefined;
  for (const issue of parsed.error.issues) {
    const path = issue.path.map(String).join(".");
    if (path.startsWith("supervisors.")) {
      fieldErrors[path] = issue.message;
      firstError ??= issue.message;
    } else {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
  }
  return {
    ok: false,
    fieldErrors,
    formError: firstError ?? parsed.error.issues[0]?.message ?? "Check the fields below.",
  };
}
