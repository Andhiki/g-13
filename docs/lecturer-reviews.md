# Lecturer reviews: submission security and configuration

The lecturer directory (`/lecturers` and `/lecturers/$lecturerId`) accepts community
reviews without an account. Submissions use an hourly per-browser limit with a per-IP
backstop, [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/), and
server-side text moderation. These checks run through the `publishLecturerReview`
server function in [`handler.ts`](../apps/web/src/routes/_public/lecturers/-server/handler.ts);
the browser never calls Cloudflare Siteverify or OpenAI Moderations directly.

## Submission flow

```
Browser (dialog on /lecturers/$lecturerId)
  │  field validation (shared schema)
  │  invisible Turnstile challenge → token
  ▼
publishLecturerReview (server function)
  │  verifyTurnstileToken(secret, token, remoteip)    ── fail → 400 "captcha"
  │  validate lecturer/course references
  │  allowReviewAction(
  │    3 / browser / UTC hour,
  │    20 / IP / UTC hour backstop)                   ── fail → 429 "rate-limit"
  │  local spam rules + OpenAI moderation
  ▼
submitReview → D1 (pending if flagged, unscorable, or any rating ≤ 2)
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

Rate-limited submissions and likes return HTTP 429 with a `Retry-After` header
containing the number of seconds until the quota resets at the next UTC hour,
rounded up. The submission form displays the server's reset timestamp in the
visitor's local time and falls back to the browser clock if no timestamp arrives.

Reviews with any rating of 2 or lower are stored as `pending` and stay out of
public listings, ratings, and search aggregates until a moderator approves them
from the dashboard. Reviews with every rating at 3 or higher publish immediately.
Every body is screened. A chosen display name is screened separately; the generated
`Anonymous` placeholder is omitted. The Worker sends only those text values to OpenAI's
Moderations API with `omni-moderation-latest`. Only `harassment`,
`harassment/threatening`, `hate`, and `hate/threatening` flags hold a review; other
category flags and the overall `flagged` value do not. A clear result preserves the
rating rule above.

Local spam rules are separate from abuse detection and require an obvious promotion
combined with an explicit purchase or registration call to action and contact details.
A negative review, URL, phone number, or ordinary contact information alone does not
trigger a hold. A local rule match, provider error, timeout, malformed response, or
missing API key keeps the review Pending for a moderator; submissions are not rejected
automatically. Only Pending submissions notify admins and maintainers.

The confirmation dialog tells the submitter when a review enters moderation.
The browser saves the random review ID in lecturer-specific local storage so
the submitter can see the pending card after a reload. The lookup requires at
least one submitted ID and returns only pending, undeleted reviews for the
requested lecturer. Pending cards are excluded from public counts, rating
averages, and likes. Once a review leaves the queue, the browser drops its
stored ID after the next successful lookup. When local storage is unavailable,
the submission still shows the confirmation dialog.

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
| `OPENAI_API_KEY`           | yes for staging/production | Server-only Moderations API key. If missing or invalid, reviews are held in Pending. |

`packages/env` validates these values in `parseSubmissionEnvironment`. `REVIEW_RATE_LIMIT_SECRET`
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
bunx cf workers secrets update OPENAI_API_KEY
```

The bindings are declared in [`cloudflare.config.ts`](../apps/web/cloudflare.config.ts).
Set `OPENAI_API_KEY` on staging and production before rollout. Local E2E mode injects
a deterministic clear result and does not contact OpenAI.

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
Siteverify as `remoteip`. The hourly IP quotas for submissions and likes group IPv6
addresses by their `/64` network, so rotating privacy addresses within a network
share a quota. IPv4 and IPv4-mapped IPv6 addresses use the same IPv4 quota.
Rate-limit identities and the submission browser identifier are HMAC'd before
storage. Raw IPs are not stored in review records
(see `packages/db/README.md`).

OpenAI receives only the review body and a chosen display name. Review, lecturer, and
course IDs, ratings, IP addresses, browser IDs, and raw provider responses are not sent
or persisted by the moderation flow.

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
