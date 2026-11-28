import "@tanstack/react-start/server-only";
import type { StrapiAlumniResponse } from "../-shared/directory";

// Server-only configuration for the alumni directory.
// The Strapi token is read from the environment at request time and is never
// serialised into a response, a log line, or the client bundle.

export function strapiToken(): string | undefined {
  if (import.meta.env.MODE === "local-e2e") return "isolated-e2e";
  const token = process.env.STRAPI_API_TOKEN?.trim();
  return token ? token : undefined;
}

export function strapiOrigin(): string {
  const raw = process.env.STRAPI_ORIGIN?.trim();
  try {
    return raw ? new URL(raw).origin : "https://strapi.kagamailkomp.id";
  } catch {
    return "https://strapi.kagamailkomp.id";
  }
}

// Strapi caps pageSize at 100 for this token. Keeping the limit here makes the
// number of upstream requests predictable: 226 public alumni need 3 pages.
const pageSize = 100;

const fields = [
  "fields[0]=name",
  "fields[1]=batch",
  "populate[kontak][fields][0]=linkedin",
  "populate[pekerjaan][fields][0]=currentEmployer",
  "populate[pekerjaan][fields][1]=position",
  "populate[metadata][fields][0]=isPublic",
  "filters[metadata][isPublic][$eq]=true",
  "sort[0]=name:asc",
  "sort[1]=id:asc",
  `pagination[pageSize]=${pageSize}`,
].join("&");

export const alumniUpstream = {
  maxPages: 5,
  timeoutMs: 8_000,
  pageUrl: (requestedPageNumber: number) =>
    `${strapiOrigin()}/api/alumnis?${fields}&pagination[page]=${requestedPageNumber}`,
};

export async function fetchAlumniPages(token: string): Promise<StrapiAlumniResponse[]> {
  if (import.meta.env.MODE === "local-e2e") {
    return [
      {
        data: [
          { id: 1, name: "Alya Fixture", batch: 2020 },
          { id: 2, name: "Bima Fixture", batch: 2020 },
          { id: 3, name: "Citra Fixture", batch: 2021 },
        ],
        meta: { pagination: { page: 1, pageCount: 1, total: 3 } },
      },
    ];
  }
  const pages: StrapiAlumniResponse[] = [];
  let expectedPageCount: number | undefined;
  for (
    let requestedPageNumber = 1;
    requestedPageNumber <= alumniUpstream.maxPages;
    requestedPageNumber++
  ) {
    const response = await fetch(alumniUpstream.pageUrl(requestedPageNumber), {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      signal: AbortSignal.timeout(alumniUpstream.timeoutMs),
    });
    if (!response.ok) throw new Error(`upstream ${response.status}`);
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data)) {
      throw new Error("Invalid alumni upstream data");
    }
    const strapiPage = body as StrapiAlumniResponse & { data: unknown[] };
    const pagination = strapiPage.meta?.pagination;
    if (!pagination || typeof pagination !== "object" || Array.isArray(pagination)) {
      throw new Error("Invalid alumni upstream pagination");
    }
    const returnedPageNumber = pagination.page;
    const pageCount = pagination.pageCount;
    if (
      typeof returnedPageNumber !== "number" ||
      !Number.isSafeInteger(returnedPageNumber) ||
      returnedPageNumber !== requestedPageNumber
    ) {
      throw new Error("Invalid alumni upstream page");
    }
    if (typeof pageCount !== "number" || !Number.isSafeInteger(pageCount) || pageCount < 0) {
      throw new Error("Invalid alumni upstream pagination");
    }
    if (pageCount > alumniUpstream.maxPages) {
      throw new Error("Alumni upstream page limit exceeded");
    }
    if (
      (pageCount === 0 && strapiPage.data.length > 0) ||
      (pageCount > 0 && strapiPage.data.length === 0)
    ) {
      throw new Error("Invalid alumni upstream pagination");
    }
    if (expectedPageCount !== undefined && pageCount !== expectedPageCount) {
      throw new Error("Inconsistent alumni upstream pagination");
    }
    expectedPageCount = pageCount;
    pages.push(strapiPage);
    if (requestedPageNumber >= pageCount) break;
  }
  assertCompleteSnapshot(pages);
  return pages;
}

// Rejects page sets that overlap or fall short of Strapi's reported total, so a
// directory that shifted mid-fetch is never sanitized and cached as a success.
function assertCompleteSnapshot(pages: StrapiAlumniResponse[]): void {
  const ids = new Set<number>();
  let rowCount = 0;
  let expectedTotal: number | undefined;
  for (const page of pages) {
    const records = page.data as unknown[];
    rowCount += records.length;
    for (const record of records) {
      if (!record || typeof record !== "object" || !("id" in record)) continue;
      const id = record.id;
      if (typeof id !== "number" || !Number.isSafeInteger(id)) continue;
      if (ids.has(id)) throw new Error("Overlapping alumni upstream pages");
      ids.add(id);
    }
    const total = page.meta?.pagination?.total;
    // Strapi omits total on some configurations; only a valid count is checked.
    if (typeof total !== "number" || !Number.isSafeInteger(total) || total < 0) continue;
    if (expectedTotal !== undefined && total !== expectedTotal) {
      throw new Error("Inconsistent alumni upstream total");
    }
    expectedTotal = total;
  }
  if (expectedTotal !== undefined && rowCount !== expectedTotal) {
    throw new Error("Incomplete alumni upstream directory");
  }
}

export const alumniCache =
  "public, max-age=300, stale-while-revalidate=86400, stale-if-error=86400";
// s-maxage disables stale serving in Workers Cache; use a separate CDN policy.
export const alumniCdnCache =
  "public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400";
