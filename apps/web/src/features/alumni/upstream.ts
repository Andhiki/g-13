import "@tanstack/react-start/server-only";
import type { StrapiAlumniResponse } from "./directory";

// Server-only configuration for the alumni directory.
// The Strapi token is read from the environment at request time and is never
// serialised into a response, a log line, or the client bundle.

export function strapiToken(): string | undefined {
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
  const pages: StrapiAlumniResponse[] = [];
  for (let page = 1; page <= alumniUpstream.maxPages; page++) {
    const response = await fetch(alumniUpstream.pageUrl(page), {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      signal: AbortSignal.timeout(alumniUpstream.timeoutMs),
    });
    if (!response.ok) throw new Error(`upstream ${response.status}`);
    const body = (await response.json()) as StrapiAlumniResponse;
    pages.push(body);
    const pageCount = body.meta?.pagination?.pageCount;
    if (typeof pageCount !== "number" || page >= pageCount) break;
  }
  return pages;
}

// Edge caches the response; the browser revalidates cheaply and keeps serving
// stale data while the edge refreshes.
export const alumniCache = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
