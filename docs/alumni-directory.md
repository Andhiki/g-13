# Direktori alumni: source, privacy, and maintenance

The `Alumni` collection lives in the community's Strapi instance at
`https://strapi.kagamailkomp.id`. The website never calls Strapi from the browser.
The `/alumni/all` route fetches and sanitises the data on the server before rendering.
The [`/api/alumni`](../../apps/web/src/routes/api/alumni.ts) route supplies retries.

## Why a server route instead of a direct request

Strapi answers browser requests with an empty `Access-Control-Allow-Origin` header
and `403`, so a direct `fetch` from the page cannot work. The token also must never
reach the client bundle. Both concerns are solved by the same route:

```
Browser → /api/alumni (Cloudflare Worker)
              │ Authorization: Bearer <STRAPI_API_TOKEN>
              ▼
        strapi.kagamailkomp.id
```

The browser only ever sees `/api/alumni`.

## Configuration

| Variable | Required | Meaning |
|---|---|---|
| `STRAPI_API_TOKEN` | yes | Read-only token for the `Alumni` collection |
| `STRAPI_ORIGIN` | no | Strapi base URL; defaults to `https://strapi.kagamailkomp.id` |

Local development: copy [`apps/web/.dev.vars.example`](../../apps/web/.dev.vars.example)
to `apps/web/.dev.vars` and fill in the token. `.dev.vars` is ignored by git.

Production: `bunx wrangler secret put STRAPI_API_TOKEN` from `apps/web`.

Never commit a token, and never paste one into an issue or chat. If a token leaks,
revoke it in Strapi admin under **Settings → API Tokens** and issue a new one. Give it
read access to the `Alumni` collection only.

Without a token the route answers `503 { "error": "unconfigured" }` and the page shows
its retry state.

## Data contract

Only these fields are requested from Strapi and forwarded:

| Field | Source | Notes |
|---|---|---|
| `id` | `id` | Stable per record |
| `name` | `name` | Whitespace collapsed |
| `batch` | `batch` | Integer year, 1945–2100, otherwise the record is dropped |
| `employer` | `pekerjaan.currentEmployer` | May be empty |
| `position` | `pekerjaan.position` | May be empty |
| `linkedin` | `kontak.linkedin` | Normalised, `null` when absent or invalid |

`phone`, `email`, `otherContacts`, `helpTopics`, `suggestions`, `statusVerification`,
`documentId`, and timestamps are **never** sent to the browser. `sanitizeAlumni()`
builds a new object from an allowlist, so a field added upstream does not leak by
default.

## Privacy rules

- Only records with `metadata.isPublic === true` are eligible. The filter is applied
  by Strapi (`filters[metadata][isPublic][$eq]=true`), so unpublished records never
  leave the source at all.
- Contact details stay private even for public records. The directory links to
  LinkedIn profiles that alumni published themselves, and nothing else.
- Do not add phone numbers, personal email addresses, or private notes to the
  directory without explicit consent from the person concerned.

## Pagination limits

Strapi caps `pagination[pageSize]` at **100** for this token regardless of the value
requested. 226 public records therefore need three pages; `alumniUpstream.maxPages`
bounds the loop. If the collection grows past 500 records, raise `maxPages`.

The browser shows all matching cards in alphabetical order. Filtering and search run client-side on the
full payload (~45 KB), which keeps typing responsive.

## Avatars

LinkedIn blocks every non-human request to profile pages (`HTTP 999`), and its terms
prohibit scraping profile photos. The directory therefore renders deterministic
initials avatars. To show a real photo, add an image field in Strapi and populate it
with the person's consent; do not derive photos from LinkedIn URLs.

## Caching

The route loader and Retry both read `/api/alumni`. The server loader uses the
`ALUMNI` self-service binding, so SSR and client navigation consult the same
Workers Cache entry as browser requests. Only the API handler fetches Strapi.
Workers Cache is enabled in `wrangler.jsonc`; its cache is shared across service
bindings and public requests, independent of hostname.
[Cloudflare Workers Cache](https://developers.cloudflare.com/workers/cache/)

Successful API responses use separate browser and CDN policies:

```
Cache-Control: public, max-age=300, stale-while-revalidate=86400, stale-if-error=86400
CDN-Cache-Control: public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400
```

The edge serves fresh data for one hour, then may serve stale data for up to one
day while refreshing in the background or when the upstream fails. A cold cache
still waits for Strapi. Errors are not stored as successful directory data.
Do not add `s-maxage`: it disables stale serving in Workers Cache.
[Cache configuration](https://developers.cloudflare.com/workers/cache/configuration/)

Successful `/alumni/all` HTML is also cached for one hour with one day of stale
serving. Client navigation calls a server function whose response remains
`no-store`, but that function now reads the cached API rather than Strapi.

## Verifying a change

```sh
bun run build:packages
bun run check
bun run build
bun run dev
```

Then open `/alumni` and `/alumni/all`, and check both desktop and mobile layouts.
Automated tests cover the sanitisation, URL normalisation and filtering
logic in [`directory.test.ts`](../../apps/web/src/features/alumni/directory.test.ts);
UI behaviour is verified manually as the contribution guide requires.
