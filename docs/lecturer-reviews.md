# Lecturer reviews: submission security and configuration

The lecturer directory (`/lecturers` and `/lecturers/$lecturerId`) accepts community
reviews without an account. Each submission is protected on the server by two layers:
an hourly per-browser rate limit with a per-IP backstop, and a
[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) check. Both run
inside the `publishLecturerReview` server function in
[`handler.ts`](../apps/web/src/routes/_public/lecturers/-server/handler.ts); the
browser never calls Cloudflare's Siteverify endpoint itself.

## Submission flow

```
Browser (dialog on /lecturers/$lecturerId)
  │  field validation (shared schema)
  │  invisible Turnstile challenge → token
  ▼
publishLecturerReview (server function)
  │  verifyTurnstileToken(secret, token, remoteip)    ── fail → 400 "captcha"
  │  allowReviewAction(
  │    3 / browser / UTC hour,
  │    20 / IP / UTC hour backstop)                   ── fail → 429 "rate-limit"
  ▼
submitReview → D1
```

The submission limit follows the browser, not the network. The browser sends the
random `lecturer-review-browser-id` UUID it already uses for likes; the server
HMACs it with `REVIEW_RATE_LIMIT_SECRET` before storing the counter. Visitors who
share a campus network, office NAT, or a mobile carrier's CGNAT therefore keep
their own quota. The per-IP ceiling bounds abuse from someone rotating browser
identifiers. When browser storage is unavailable, the IP keeps the strict
three-per-hour limit. Likes have a separate bucket and never consume submission
limits. The browser identifier is a client-controlled hint, not an authenticated
identity; Turnstile remains the primary gate for every submission.

Reviews with any rating of 2 or lower are stored as `pending` and stay out of
public listings, ratings, and search aggregates until a moderator approves them
from the dashboard. Reviews with every rating at 3 or higher publish immediately.
Only pending submissions notify admins and maintainers; immediate publications
do not.

The Turnstile widget is **invisible** (`execution: "execute"`, `appearance: "interaction-only"`).
Nothing is shown for ordinary visitors; the challenge runs only when the form is
submitted, and the token is generated on demand. See
[`TurnstileField.tsx`](../apps/web/src/routes/_public/lecturers/-components/TurnstileField.tsx).

## Configuration

| Variable                   | Required | Meaning                                                                                                              |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `REVIEW_RATE_LIMIT_SECRET` | yes      | 32+ random characters. Server-only; HMACs the per-IP rate-limit key.                                                 |
| `TURNSTILE_SITE_KEY`       | no       | Public widget site key. Delivered to the browser through the `loadTurnstileSiteKey` server function, not the bundle. |
| `TURNSTILE_SECRET_KEY`     | no       | Server-only Turnstile secret used by Siteverify. Never reaches the browser.                                          |

`packages/env` validates all three in `parseSubmissionEnvironment`. `REVIEW_RATE_LIMIT_SECRET`
must be present. The Turnstile keys are optional **but fail closed**: when
`TURNSTILE_SECRET_KEY` is empty, `verifyTurnstileToken` returns `false` and every
submission is rejected with `400 "captcha"`. There is no "skip when unset" mode — to
accept reviews, both Turnstile keys must be configured together (a site key and secret
from the **same** widget).

Local development: copy [`apps/web/.env.example`](../apps/web/.env.example) and fill
in the keys. Production: set each value as a Worker secret from `apps/web`:

```sh
bunx cf workers secrets update REVIEW_RATE_LIMIT_SECRET
bunx cf workers secrets update TURNSTILE_SITE_KEY
bunx cf workers secrets update TURNSTILE_SECRET_KEY
```

The bindings are declared in [`cloudflare.config.ts`](../apps/web/cloudflare.config.ts).

## Fail-closed behavior

`verifyTurnstileToken` in
[`turnstile.ts`](../apps/web/src/routes/_public/lecturers/-server/turnstile.ts)
returns `false` — and the submission is rejected — when:

- the secret or token is empty;
- Siteverify answers non-2xx, `success: false`, or malformed JSON;
- the request errors or exceeds the 10-second timeout.

Turnstile tokens are single-use and expire after 300 seconds, so verification happens
on every submission; a stale token must be re-challenged. The client shows
"Complete the security check and try again." when no token is produced, and
"Security verification failed. Please try again." when the server rejects the token.

## Deployment and domains

Turnstile has two independent requirements that are easy to confuse:

1. **The widget authorises the visible hostname.** In the Turnstile dashboard, a
   widget's _Hostname Management_ list must include every hostname the app is served
   from (root domains also cover their subdomains). The widget used here already lists
   `omahti.com`, `andhiki.tech`, `andhikiandre.workers.dev`, `localhost`, and
   `127.0.0.1`.
2. **The secret must live in the worker that runs verification.** Siteverify runs in
   the worker that executes the server function, so `TURNSTILE_SECRET_KEY` must be set
   on _that_ worker.

Because of (2), a deployment that only **proxies** requests to another worker does not
verify anything itself: the secret belongs on the origin worker that serves the app,
not on the proxy. For example, if `csugm.omahti.com` is a Cloudflare Worker that just
forwards `fetch(request)` to `csugm.andhiki.tech`, then verification happens on the
`csugm.andhiki.tech` worker, and `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` are set
there. The widget still works on both domains as long as its hostname list covers both.

`TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are always a matched pair from one
widget; mixing a site key from one widget with a secret from another fails verification.

## Testing

Cloudflare publishes dummy keys that work on any hostname, including `localhost`
(see [Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)):

| Site key                   | Secret key                            | Result                          |
| -------------------------- | ------------------------------------- | ------------------------------- |
| `1x00000000000000000000BB` | `1x0000000000000000000000000000000AA` | Invisible widget, always passes |
| `2x00000000000000000000BB` | `2x0000000000000000000000000000000AA` | Invisible widget, always fails  |

Use the "always passes" pair for local UI work and the "always fails" pair to exercise
the rejection path. Production keys reject dummy tokens and vice versa.

## Privacy

Invisible mode requires referencing Cloudflare's
[Turnstile Privacy Addendum](https://www.cloudflare.com/trust-hub/privacy-and-compliance/)
in the app's own privacy policy. The server passes the visitor's `CF-Connecting-IP` to
Siteverify as `remoteip` and uses the same IP for the hourly per-IP backstop; the
browser identifier is HMAC'd before storage. Raw IPs are not stored in review records
(see `packages/db/README.md`).

## Verifying a change

```sh
bun run build:packages
bun run check
bun run build
bun run dev
```

Open a lecturer detail page, submit a review, and confirm it is stored. Then set
`TURNSTILE_SECRET_KEY` to the "always fails" secret (or blank) and confirm the
submission is rejected with the security message. Automated tests cover token
verification in
[`turnstile.test.ts`](../apps/web/src/routes/_public/lecturers/-server/turnstile.test.ts)
and the rate limit in `service.test.ts`; the widget itself is verified manually.
