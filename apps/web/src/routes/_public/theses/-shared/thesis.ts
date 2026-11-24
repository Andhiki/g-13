import type {
  ThesisContactChannel,
  ThesisLanguage,
  ThesisSupervisorRole,
  ThesisType,
} from "@g13/db/schema/theses";

export type { ThesisType };

export type ThesisSupervisorRecord = {
  name: string;
  lecturerId: string | null;
  lecturerName: string | null;
  lecturerDeletedAt: Date | null;
  role: ThesisSupervisorRole | null;
};

export type ThesisCardRecord = {
  id: string;
  title: string;
  authorName: string;
  authorBatch: number | null;
  year: number;
  type: ThesisType;
  field: string | null;
  keywords: string[];
  supervisors: ThesisSupervisorRecord[];
};

export type ThesisDetailRecord = ThesisCardRecord & {
  abstract: string | null;
  abstractEn: string | null;
  language: ThesisLanguage;
  repositoryUrl: string | null;
  contactChannel: ThesisContactChannel | null;
  contactValue: string | null;
  abstractPublic: boolean;
  contactPublic: boolean;
};

export type ThesisSupervisor = {
  name: string;
  lecturerId: string | null;
  role: ThesisSupervisorRole | null;
};

export type ThesisCard = {
  slug: string;
  title: string;
  authorName: string;
  authorBatch: number | null;
  year: number;
  type: ThesisType;
  field: string | null;
  keywords: string[];
  supervisors: ThesisSupervisor[];
};

export type ThesisContact = {
  channel: ThesisContactChannel;
  value: string;
};

export type ThesisDetail = ThesisCard & {
  abstract: string | null;
  abstractEn: string | null;
  language: ThesisLanguage;
  repositoryUrl: string | null;
  contact: ThesisContact | null;
};

export type ThesesIndexData = {
  items: ThesisCard[];
  years: number[];
  types: ThesisType[];
  fields: string[];
};

export type ThesesIndexState =
  { status: "ready"; data: ThesesIndexData } | { status: "unavailable" };

const thesisTypeOrder: ThesisType[] = [
  "skripsi",
  "product-innovation",
  "collaborative-project",
  "industry-project",
  "scientific-publication",
];

const typeLabelKeys: Record<ThesisType, string> = {
  skripsi: "Skripsi",
  "product-innovation": "Product innovation",
  "collaborative-project": "Collaborative project",
  "industry-project": "Industry project",
  "scientific-publication": "Scientific publication",
};

const languageLabelKeys: Record<ThesisLanguage, string> = {
  id: "Indonesian",
  en: "English",
};

export function thesisTypeLabelKey(type: ThesisType): string {
  return typeLabelKeys[type];
}

export function thesisLanguageLabelKey(language: ThesisLanguage): string {
  return languageLabelKeys[language];
}

function trimmed(value: string | null): string | null {
  const text = value?.trim();
  return text ? text : null;
}

export function safeHttpUrl(value: string | null): string | null {
  const raw = trimmed(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function publicContact(
  channel: ThesisContactChannel | null,
  value: string | null,
): ThesisContact | null {
  const raw = trimmed(value);
  if (!raw || !channel) return null;
  if (channel === "email") {
    const email = raw.replace(/^mailto:/i, "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { channel: "email", value: email } : null;
  }
  const url = safeHttpUrl(raw);
  return url ? { channel: "url", value: url } : null;
}

function publicSupervisor(supervisor: ThesisSupervisorRecord): ThesisSupervisor {
  const linked =
    supervisor.lecturerId && supervisor.lecturerName && !supervisor.lecturerDeletedAt
      ? { lecturerId: supervisor.lecturerId, name: supervisor.lecturerName }
      : null;
  return {
    name: linked?.name ?? supervisor.name,
    lecturerId: linked?.lecturerId ?? null,
    role: supervisor.role,
  };
}

export function toThesisCard(record: ThesisCardRecord): ThesisCard {
  return {
    slug: record.id,
    title: record.title,
    authorName: record.authorName,
    authorBatch: record.authorBatch,
    year: record.year,
    type: record.type,
    field: record.field,
    keywords: [...record.keywords],
    supervisors: record.supervisors.map(publicSupervisor),
  };
}

export function toThesisDetail(record: ThesisDetailRecord): ThesisDetail {
  const card = toThesisCard(record);
  return {
    ...card,
    abstract: record.abstractPublic ? trimmed(record.abstract) : null,
    abstractEn: record.abstractPublic ? trimmed(record.abstractEn) : null,
    language: record.language,
    repositoryUrl: safeHttpUrl(record.repositoryUrl),
    contact: record.contactPublic
      ? publicContact(record.contactChannel, record.contactValue)
      : null,
  };
}

export function thesisYears(items: ThesisCard[]): number[] {
  return [...new Set(items.map((item) => item.year))].sort((left, right) => right - left);
}

export function thesisTypes(items: ThesisCard[]): ThesisType[] {
  const present = new Set(items.map((item) => item.type));
  return thesisTypeOrder.filter((type) => present.has(type));
}

export function thesisFields(items: ThesisCard[]): string[] {
  return [...new Set(items.flatMap((item) => (item.field ? [item.field] : [])))].sort(
    (left, right) => left.localeCompare(right, "id", { sensitivity: "base" }),
  );
}

export function composeThesesIndex(records: ThesisCardRecord[]): ThesesIndexData {
  const items = records.map(toThesisCard);
  return {
    items,
    years: thesisYears(items),
    types: thesisTypes(items),
    fields: thesisFields(items),
  };
}

export type ThesisFilter = {
  query?: string;
  year?: number | null;
  type?: ThesisType | null;
  field?: string | null;
};

export function filterTheses(items: ThesisCard[], filter: ThesisFilter): ThesisCard[] {
  const query = filter.query?.trim().toLocaleLowerCase("id") ?? "";
  return items.filter((item) => {
    if (filter.year != null && item.year !== filter.year) return false;
    if (filter.type && item.type !== filter.type) return false;
    if (filter.field && item.field !== filter.field) return false;
    if (!query) return true;
    const haystack = [
      item.title,
      item.authorName,
      item.field ?? "",
      ...item.keywords,
      ...item.supervisors.map((supervisor) => supervisor.name),
    ]
      .join(" ")
      .toLocaleLowerCase("id");
    return haystack.includes(query);
  });
}

export function abstractParagraphs(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function citationFor(thesis: ThesisDetail, typeLabel: string): string {
  const base = `${thesis.authorName} (${thesis.year}). ${thesis.title} [${typeLabel}]. Universitas Gadjah Mada.`;
  return thesis.repositoryUrl ? `${base} ${thesis.repositoryUrl}` : base;
}

export function metaDescriptionFor(thesis: ThesisCard | ThesisDetail, fallback: string): string {
  const abstract = "abstract" in thesis ? thesis.abstract : null;
  const source = abstract ?? `${thesis.authorName} (${thesis.year}) — ${thesis.title}`;
  const normalized = source.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > 150 ? `${normalized.slice(0, 147).trimEnd()}…` : normalized;
}

export type ThesisJsonLd = {
  "@context": "https://schema.org";
  "@type": "Thesis";
  name: string;
  author: { "@type": "Person"; name: string };
  contributor?: { "@type": "Person"; name: string }[];
  abstract?: string;
  datePublished: string;
  inLanguage: ThesisLanguage;
  keywords?: string;
  url: string;
  identifier: string;
  sameAs?: string;
  publisher: { "@type": "CollegeOrUniversity"; name: string };
  educationalLevel: string;
};

export function jsonLdFor(thesis: ThesisDetail, url: string): ThesisJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Thesis",
    name: thesis.title,
    author: { "@type": "Person", name: thesis.authorName },
    ...(thesis.supervisors.length
      ? {
          contributor: thesis.supervisors.map((supervisor) => ({
            "@type": "Person" as const,
            name: supervisor.name,
          })),
        }
      : {}),
    ...(thesis.abstract ? { abstract: thesis.abstract } : {}),
    datePublished: String(thesis.year),
    inLanguage: thesis.language,
    ...(thesis.keywords.length ? { keywords: thesis.keywords.join(", ") } : {}),
    url,
    identifier: thesis.slug,
    ...(thesis.repositoryUrl ? { sameAs: thesis.repositoryUrl } : {}),
    publisher: { "@type": "CollegeOrUniversity", name: "Universitas Gadjah Mada" },
    educationalLevel: "S1 Ilmu Komputer",
  };
}
