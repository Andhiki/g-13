// Pure alumni directory logic shared by the server route and the browser view.
// No network access here: the route fetches, this module only transforms and filters.

export type AlumniCard = {
  id: number;
  name: string;
  batch: number;
  employer: string;
  position: string;
  education?: string;
  linkedin: string | null;
};

export type AlumniDirectoryData = {
  items: AlumniCard[];
  batches: number[];
  total: number;
};

// Shape of the Strapi response we request. Every field except name/batch is optional
// because Strapi omits relations a token is not allowed to read.
type StrapiRelation<T> = T | null | undefined;

export type StrapiAlumni = {
  id?: unknown;
  name?: unknown;
  batch?: unknown;
  kontak?: StrapiRelation<{ linkedin?: unknown }>;
  pekerjaan?: StrapiRelation<{ currentEmployer?: unknown; position?: unknown }>;
};

export type StrapiAlumniResponse = {
  data?: unknown;
  meta?: { pagination?: { page?: unknown; pageCount?: unknown; total?: unknown } };
};

const text = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

/**
 * Restores the canonical profile URL from the many shapes stored in Strapi:
 * missing scheme, regional subdomain, tracking query strings and trailing slashes.
 * Returns null for anything that is not a LinkedIn profile.
 */
export function normalizeLinkedIn(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|[a-z]{2})\./, "");
  if (host !== "linkedin.com") return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2 || segments[0].toLowerCase() !== "in") return null;
  const slug = segments[1]!;
  if (!/^[\w\-%.]{1,100}$/.test(slug)) return null;
  return `https://www.linkedin.com/in/${slug}`;
}

/**
 * Converts one Strapi record into a public card.
 * Private fields never reach this function's output, so a stray contact number in
 * the upstream payload cannot leak into the browser.
 */
export function sanitizeAlumni(record: StrapiAlumni): AlumniCard | null {
  const name = text(record?.name);
  const batch =
    typeof record?.batch === "number" ? record.batch : Number.parseInt(text(record?.batch), 10);
  if (!name || !Number.isInteger(batch) || batch < 1945 || batch > 2100) return null;
  return {
    id: typeof record.id === "number" ? record.id : hashId(name, batch),
    name,
    batch,
    employer: text(record.pekerjaan?.currentEmployer),
    position: text(record.pekerjaan?.position),
    linkedin: normalizeLinkedIn(record.kontak?.linkedin),
  };
}

/** Stable fallback identity for records whose numeric id is unavailable. */
function hashId(name: string, batch: number): number {
  let hash = batch;
  for (let index = 0; index < name.length; index++) {
    hash = (hash * 31 + name.charCodeAt(index)) % 2_147_483_647;
  }
  return hash;
}

/**
 * Turns a Strapi pages collection into directory data.
 * Duplicate ids are dropped so page overlaps during a refresh cannot show a person twice.
 */
export function collectAlumni(pages: StrapiAlumniResponse[]): AlumniDirectoryData {
  const seen = new Set<number>();
  const items: AlumniCard[] = [];
  let total = 0;
  for (const page of pages) {
    const records = Array.isArray(page?.data) ? page.data : [];
    for (const record of records) {
      const card = sanitizeAlumni(record as StrapiAlumni);
      if (!card || seen.has(card.id)) continue;
      seen.add(card.id);
      items.push(card);
    }
    const reported = page?.meta?.pagination?.total;
    if (typeof reported === "number" && reported > total) total = reported;
  }
  items.sort(
    (left, right) =>
      left.name.localeCompare(right.name, "id", { sensitivity: "base" }) || left.id - right.id,
  );
  return {
    items,
    batches: [...new Set(items.map((item) => item.batch))].sort((left, right) => right - left),
    total: Math.max(total, items.length),
  };
}

export type AlumniFilter = { batch?: number; query?: string };

export function filterAlumni(items: AlumniCard[], filter: AlumniFilter): AlumniCard[] {
  const query = text(filter.query).toLowerCase();
  return items.filter((item) => {
    if (filter.batch !== undefined && item.batch !== filter.batch) return false;
    if (!query) return true;
    return `${item.name} ${item.employer} ${item.position}`.toLowerCase().includes(query);
  });
}

// Titles appear after a comma or as dotted abbreviations, never as a plain surname.
// Requires at least one dot so names like "Mira" or "Dewi" survive untouched.
const academicAbbreviations = /^[a-z]{1,4}(\.[a-z]{1,4})+\.?$/i;

const academicPrefixes = /^(dr|drs|dra|prof|ir|s|m|a)\.$/i;

function isAcademicTitle(word: string): boolean {
  return academicAbbreviations.test(word) || academicPrefixes.test(`${word}.`);
}

/**
 * Initials for the avatar placeholder; at most two letters.
 * Academic titles ("S.Kom", "M.S.E") are dropped because the last plain word is
 * the surname people actually recognise.
 */
export function alumniInitials(name: string): string {
  const words = text(name)
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter((word) => /^[\p{L}\p{N}]/u.test(word) && !isAcademicTitle(word));
  if (words.length === 0) return "?";
  const first = words[0]![0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]![0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

const avatarTones = [
  { solid: "bg-faded-light text-faded-dark" },
  { solid: "bg-information-light text-information-dark" },
  { solid: "bg-success-light text-success-dark" },
  { solid: "bg-warning-light text-warning-dark" },
  { solid: "bg-feature-light text-feature-dark" },
] as const;

export type AlumniAvatarTone = (typeof avatarTones)[number];

/** Deterministic avatar tone so a person keeps the same colour across visits. */
export function alumniAvatarTone(id: number): AlumniAvatarTone {
  return avatarTones[Math.abs(id) % avatarTones.length]!;
}
