import { canModerate } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { THESIS_ADMIN_ERRORS, type ThesisAdminResult } from "../-shared/errors";
import type {
  CreateThesisInput,
  ThesisLifecycleInput,
  ThesisStatusFilter,
  UpdateThesisInput,
} from "../-shared/schemas";
import {
  allocateThesisId,
  createThesisRecord,
  getAdminThesisById,
  getAdminThesisCounts,
  getAdminThesisFields,
  getAdminThesisLecturers,
  listAdminTheses,
  setThesisLifecycle,
  slugifyThesisId,
  thesisIdExists,
  updateThesisRecord,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;
type Actor = { id: string; role?: string | null };
type ThesisListData = {
  rows: Awaited<ReturnType<typeof listAdminTheses>>;
  counts: Awaited<ReturnType<typeof getAdminThesisCounts>>;
  lecturers: Awaited<ReturnType<typeof getAdminThesisLecturers>>;
  fields: Awaited<ReturnType<typeof getAdminThesisFields>>;
};

function requiresConsent(input: CreateThesisInput | UpdateThesisInput): boolean {
  return input.status === "published" || input.abstractPublic || input.contactPublic;
}

function hasConsent(input: CreateThesisInput | UpdateThesisInput): boolean {
  return input.consentRecorded && Boolean(input.consentSource);
}

function consentValues(
  input: CreateThesisInput | UpdateThesisInput,
  existingConsentAt: Date | null,
): { consentAt: Date | null; consentSource: string | null } {
  return {
    consentAt: input.consentRecorded ? (existingConsentAt ?? new Date()) : null,
    consentSource: input.consentRecorded ? input.consentSource : null,
  };
}

export async function inspectTheses(
  db: Database,
  actor: Actor,
  offset = 0,
  status: ThesisStatusFilter = "draft",
): Promise<ThesisAdminResult<ThesisListData>> {
  if (!canModerate(actor.role)) return { data: null, error: THESIS_ADMIN_ERRORS.FORBIDDEN };
  const [rows, counts, lecturers, fields] = await Promise.all([
    listAdminTheses(db, offset, status),
    getAdminThesisCounts(db),
    getAdminThesisLecturers(db),
    getAdminThesisFields(db),
  ]);
  return { data: { rows, counts, lecturers, fields }, error: null };
}

export async function createThesis(
  db: Database,
  actor: Actor,
  input: CreateThesisInput,
): Promise<ThesisAdminResult<{ id: string }>> {
  if (!canModerate(actor.role)) return { data: null, error: THESIS_ADMIN_ERRORS.FORBIDDEN };
  if (requiresConsent(input) && !hasConsent(input)) {
    return { data: null, error: THESIS_ADMIN_ERRORS.CONSENT_REQUIRED };
  }

  let id: string;
  if (input.slug) {
    id = slugifyThesisId(input.slug);
    if (await thesisIdExists(db, id)) {
      return { data: null, error: THESIS_ADMIN_ERRORS.SLUG_TAKEN };
    }
  } else {
    id = await allocateThesisId(db, input.title, input.year);
  }

  const consent = consentValues(input, null);
  await createThesisRecord(db, id, input, consent.consentAt, consent.consentSource);
  return { data: { id }, error: null };
}

export async function updateThesis(
  db: Database,
  actor: Actor,
  input: UpdateThesisInput,
): Promise<ThesisAdminResult<{ thesisId: string }>> {
  if (!canModerate(actor.role)) return { data: null, error: THESIS_ADMIN_ERRORS.FORBIDDEN };
  const existing = await getAdminThesisById(db, input.thesisId);
  if (!existing || existing.deletedAt) {
    return { data: null, error: THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE };
  }
  if (requiresConsent(input) && !hasConsent(input)) {
    return { data: null, error: THESIS_ADMIN_ERRORS.CONSENT_REQUIRED };
  }

  const consent = consentValues(input, existing.consentAt);
  await updateThesisRecord(db, input.thesisId, input, consent.consentAt, consent.consentSource);
  return { data: { thesisId: input.thesisId }, error: null };
}

export async function changeThesisLifecycle(
  db: Database,
  actor: Actor,
  input: ThesisLifecycleInput,
): Promise<ThesisAdminResult<ThesisLifecycleInput>> {
  if (!canModerate(actor.role)) return { data: null, error: THESIS_ADMIN_ERRORS.FORBIDDEN };
  const existing = await getAdminThesisById(db, input.thesisId);
  if (!existing) {
    return { data: null, error: THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE };
  }

  if (input.action === "publish") {
    if (existing.deletedAt) {
      return { data: null, error: THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE };
    }
    if (!existing.consentAt || !existing.consentSource) {
      return { data: null, error: THESIS_ADMIN_ERRORS.CONSENT_REQUIRED };
    }
    if (
      !existing.title.trim() ||
      !existing.authorName.trim() ||
      existing.supervisors.length === 0
    ) {
      return { data: null, error: THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE };
    }
  }
  if (input.action === "restore" && !existing.deletedAt) {
    return { data: null, error: THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE };
  }
  if (input.action !== "restore" && existing.deletedAt) {
    return { data: null, error: THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE };
  }

  if (!(await setThesisLifecycle(db, input))) {
    return { data: null, error: THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE };
  }
  return { data: input, error: null };
}
