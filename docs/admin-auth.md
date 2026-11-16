# Admin authentication and moderation

Implementation for [#27](https://github.com/Andhiki/g-13/issues/27), following
[ADR 0004](adr/0004-admin-auth-boundary.md) and
[web feature ownership](web-feature-structure.md). The latest issue and the
maintainer's subsequent approval of first-time signup supersede older login and
onboarding proposals in the research notes.

This backend commit contains the auth factory, schema, request authorization,
and moderation RPCs. Login/admin screens, client integration, and the
`/api/auth/$` route with its generated registration remain uncommitted pending
UI review; the access behavior below describes the combined implementation.

## Access

- GitHub OAuth is the only login provider. Local password login is disabled.
- First-time sign-in creates `user`, with no admin access. GitHub email
  verification does not constitute administrator approval.
- `admin` and `maintainer` may inspect, hide, restore, and soft-delete reviews.
- Only `admin` may inspect users and explicitly assign `maintainer` or `admin`
  after approving the person. Assigning `user` removes privileged access.
- Users cannot supply their own role through Better Auth's user-input endpoints.
  Maintainers cannot assign roles. The admin interface disallows changing one's
  own role; another administrator must handle that change.
- Route checks protect navigation, including preloads. Every protected server
  read/mutation separately reads the authoritative session and role from D1.
  Client query state is not an authorization source. Cookie caching is disabled.
- Sign-out revokes the current session. Role changes take effect on the next
  protected request, including for existing sessions. Previously downloaded
  information cannot be recalled from a browser.
- Account linking is disabled: matching email addresses do not link a different
  GitHub identity to an existing account. Recovery must not bypass this rule.
- Public review submission remains account-free and immediately published.

## Boundaries and schema

`packages/auth` owns the Better Auth factory and reusable role policy. Its
`./server` export is separate from browser-safe policy exports. The web app owns
request bindings, cookie forwarding, routes, query integration, and UI.
`packages/env` validates server configuration; `packages/db` owns the Drizzle and
explicit SQL schemas. D1 interactive transactions and optional adapter joins are
not enabled. No migrations are generated.

Like bimbet, SSR identity checks use the incoming cookies and browser navigation
uses the Better Auth client. Unlike a general-purpose cached identity query,
admin identity checks are immediately stale and protected actions always recheck
server-side. No auth package reads runtime bindings during module initialization.

Apply schema changes only to the local D1 emulator for development using
`bun run db:push`. Do not apply this schema to production as part of this work.

## Configuration

Use server-only `BETTER_AUTH_SECRET` (at least 32 random characters),
`BETTER_AUTH_URL`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`.
See `apps/web/.env.example`; it contains no credentials. Use the private secret
entry tool when supplying credentials to an agent. Do not commit real values.

Register the GitHub OAuth callback as
`<BETTER_AUTH_URL>/api/auth/callback/github`. Set the base URL to the app's origin;
HTTPS is required except on localhost. Trusted origins contain only that origin.
CSRF and origin checks remain explicitly enabled. Cookies are HttpOnly,
SameSite=Lax, and Secure on HTTPS. Unconfigured auth fails closed.

## Session privacy and abuse controls

The implementation deliberately does not persist session IP addresses or user
agents. Hooks clear both on creation and update rather than inheriting Better
Auth's metadata defaults. Client IP is still used transiently for rate limiting,
trusting only Cloudflare's overwritten `cf-connecting-ip` header. When absent,
Better Auth uses a shared per-path bucket, not an untrusted forwarded header.

D1 rate-limit keys are domain-separated HMAC-SHA-256 digests, not raw IPs.
Counters expire after their rule's window and expired rows are removed on the
next auth rate-limit request. The general limit is 100 requests/minute per
IP/path, with 10 GitHub sign-in attempts/minute; Better Auth's other stricter
endpoint-specific rules remain enabled. No process-local memory limiter is used.

Sessions expire after seven days and may refresh after one day. OAuth tokens
are encrypted with Better Auth's supported encryption, not custom cryptography.
Account/identity records persist until operationally removed. Permanent identity
and expired-session cleanup/retention procedures remain a deployment decision;
soft-deleting a review is not permanent erasure. These auth records do not change
review-submission retention policy or resolve #26.

## Still open; no production readiness claim

- Owner-approved first-admin bootstrap, recovery, and emergency offboarding.
  There is no public bootstrap endpoint, automatic first-admin promotion, or
  administrator allowlist. Local test identities are fixtures, not provisioning.
- Real GitHub OAuth credentials and a live end-to-end callback check.
- Workers plan selection and deployed invocation CPU measurements for OAuth,
  session refresh, `/admin` SSR, and moderation RPCs, including cold requests.
  Better Auth 1.7.25 without local password hashing is not evidence of fitting
  Workers Free's 10 ms total-request CPU budget. Do not weaken cryptography.
- Existing #26 launch, takedown, retention, and erasure obligations remain open.

No deployment or production D1 mutation is part of this work.
