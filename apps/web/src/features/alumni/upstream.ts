import "@tanstack/react-start/server-only";

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
  "sort[0]=batch:desc",
  "sort[1]=name:asc",
  `pagination[pageSize]=${pageSize}`,
].join("&");

export const alumniUpstream = {
  maxPages: 5,
  timeoutMs: 8_000,
  pageUrl: (page: number) => `${strapiOrigin()}/api/alumnis?${fields}&pagination[page]=${page}`,
};

// Edge caches the response; the browser revalidates cheaply and keeps serving
// stale data while the edge refreshes.
export const alumniCache = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
