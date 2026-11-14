# Alumni ISR investigation

Checked 2026-11-14 against current official documentation and repository source.
The initial research preceded implementation; the follow-up below records the fix.

## Expected behavior

TanStack Start describes ISR through HTTP cache headers and separates CDN caching
from the router's client cache. Its Cloudflare example sets response headers; it
does not implement an application cache itself. Prerendering is an additional
build-time option. This app uses `tanstackStart()` without prerender options, so
its first uncached alumni document is rendered on request.
[TanStack ISR guide](https://tanstack.com/start/latest/docs/framework/react/guide/isr#cloudflare-workers)

Cloudflare now provides **Workers Cache**, enabled with `cache.enabled: true` in
Wrangler. It checks before executing the Worker, caches GET/HEAD responses, and
supports stale-while-revalidate. The app already enables this facility in
`apps/web/wrangler.jsonc`. Therefore a custom `caches.default` wrapper is not
required to make these responses cacheable.
[Workers Cache](https://developers.cloudflare.com/workers/cache/),
[configuration](https://developers.cloudflare.com/workers/cache/configuration/)

Do not confuse Workers Cache with the runtime Cache API. Cloudflare explicitly
distinguishes the two; the latter's `cache.put`/`cache.match` methods do not support
stale directives. That limitation does not apply to this app's configured mechanism.
[Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)

## Source findings

| Request | Source behavior | Consequence |
| --- | --- | --- |
| Successful GET `/alumni/all` | Global middleware sets `public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400` | Compatible with Workers Cache background refresh and stale-on-error. Browser freshness also lasts one hour. |
| Client navigation loader | `loadDirectory()` invokes a GET server function that directly calls `fetchAlumniPages()` | Its server-function URL does not match `/alumni/all` or `/api/alumni`, so global middleware gives it `no-store`. Document caching does not cache this separate response. |
| Successful GET `/api/alumni` | `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` | Edge freshness is one hour, but **SWR is disabled by `s-maxage`** under the documented Workers Cache semantics. |
| Retry action | `useAlumniDirectory` fetches `/api/alumni` only after a retry attempt | The cacheable JSON endpoint is not used for the normal loader path. |

Local evidence: `apps/web/src/start.ts`, `apps/web/src/cache-policy.ts`,
`apps/web/src/routes/alumni_.all.tsx`, `apps/web/src/routes/api/alumni.ts`,
`apps/web/src/features/alumni/upstream.ts`, and
`apps/web/src/features/alumni/useAlumniDirectory.ts`.

Cloudflare specifically documents that `s-maxage`, `must-revalidate`, and
`proxy-revalidate` suppress both stale-while-revalidate and stale-if-error. For
different browser and edge freshness while preserving SWR, use a CDN cache-control
header with `max-age`, rather than `s-maxage`. This contradicts the comment above
`alumniCache` promising background edge refresh.
[Cache directive semantics](https://developers.cloudflare.com/workers/cache/configuration/)

`readLanguage()` appends `Vary: Cookie, Accept-Language`. Workers Cache supports
Vary and stores exact header-value combinations separately. Thus an arbitrary
additional cookie or a textually different language preference can cause a fresh
variant even when the resolved app language is unchanged. This is cache
fragmentation, not evidence that caching is broken. Removing Vary without another
language-aware cache key would risk serving the wrong language.
[Workers Cache content negotiation](https://developers.cloudflare.com/workers/cache/#content-negotiation-with-vary)

## Live evidence and remaining limits

The parent investigation reported a document GET at 15:16:27 UTC returning MISS,
followed at 15:16:35 UTC by HIT with `Age: 7`; both bodies had the same SHA-256.
This confirms document cache reuse for those requests and that variant. It does
not demonstrate a full expiration/background-refresh cycle or client navigation
reuse. Cloudflare documents MISS/HIT as the expected first/subsequent request
sequence.
[Workers Cache verification](https://developers.cloudflare.com/workers/cache/)

The strongest source-level discrepancy is the uncached normal server-function
loader path. The API's `s-maxage` also conflicts with its stated SWR intent. Verify
the browser's actual navigation request and test expiration separately before
claiming either change has fixed production behavior.

## Recommended direction

Use one shared cacheable public-data path for SSR, client navigation, and retry
so all three benefit from the same freshness policy. A direct internal function
call does not consult an HTTP response cache. Separate browser and edge TTL with
CDN-specific `max-age` if the API must retain SWR. Consider a normalized locale
cache key rather than full Cookie/Accept-Language variance, while preserving the
language distinction before cache lookup.

## Browser reproduction

On 2026-11-14 at approximately 15:27 UTC, opened `/alumni` in the T3 preview
browser and clicked “Jelajahi semua alumni”, then clicked “Try again”. A temporary
page-level fetch tracer captured response status, cache headers, and elapsed time.

- Initial navigation requested `/_serverFn/de0d81babd27c2ba1d262e4fd6365f1119abf09bfb397da77055a19ebf532415`.
  It returned 503 after 8,194 ms, `Cache-Control: no-store`, and
  `Cf-Cache-Status: BYPASS`. The page showed the directory failure and Retry.
- Retry requested `/api/alumni`. It returned 200 after 87 ms with
  `Cf-Cache-Status: HIT`; the page displayed 226 alumni.

This confirms the user-visible problem: navigation bypasses already available
cached directory data. It does not demonstrate failed background regeneration.
The failure timing is consistent with `AbortSignal.timeout(8_000)` in the upstream
fetcher, but the server function catches every error and exposes only null/503,
so the precise upstream error cannot be established from the browser response.
The endpoint is already cached; the primary correction is to make the initial
loader use the same cached data path. HTML cache hits were verified; SWR
expiration was not observed.


## Implementation follow-up

The route loader now fetches `/api/alumni` through an `ALUMNI` self-service
binding. Retry uses the same endpoint over HTTP. The API alone fetches Strapi.
A separate `CDN-Cache-Control` policy preserves one-hour edge freshness without
`s-maxage`, and both policies allow one day of background refresh/stale-on-error.

Verification used the production build under local Wrangler with a synthetic
Strapi server. SSR included directory data; browser navigation loaded it on the
first attempt; after forcing an upstream error, API/page failures were `no-store`
and restoring the upstream allowed Retry to recover. `bun run check` and
`bun run build` passed. Local Wrangler did not expose edge cache-status headers;
a deployed expiration/background-refresh cycle remains unverified.
