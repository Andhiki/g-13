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
  pageUrl: (page: number) => `${strapiOrigin()}/api/alumnis?${fields}&pagination[page]=${page}`,
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
        meta: { pagination: { pageCount: 1, total: 3 } },
      },
    ];
  }
  const pages: StrapiAlumniResponse[] = [];
  for (let page = 1; page <= alumniUpstream.maxPages; page++) {
    const response = await fetch(alumniUpstream.pageUrl(page), {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      signal: AbortSignal.timeout(alumniUpstream.timeoutMs),
    });
    if (!response.ok) throw new Error(`upstream ${response.status}`);
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data)) {
      throw new Error("Invalid alumni upstream data");
    }
    const result = body as StrapiAlumniResponse;
    const pageCount = result.meta?.pagination?.pageCount;
    if (typeof pageCount !== "number" || !Number.isSafeInteger(pageCount) || pageCount < 0) {
      throw new Error("Invalid alumni upstream pagination");
    }
    if (pageCount > alumniUpstream.maxPages) {
      throw new Error("Alumni upstream page limit exceeded");
    }
    pages.push(result);
    if (page >= pageCount) break;
  }
  return pages;
}

export const alumniCache =
  "public, max-age=300, stale-while-revalidate=86400, stale-if-error=86400";
// s-maxage disables stale serving in Workers Cache; use a separate CDN policy.
export const alumniCdnCache =
  "public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400";
