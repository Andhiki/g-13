# Moderator authentication on Cloudflare Workers

Researched **2026-11-15** for [#27](https://github.com/Andhiki/g-13/issues/27).
Research only: no authentication implementation, dependency installation, deployment,
credentials, or CPU benchmark. Better Auth is not installed in this checkout.

## Decisions and recommendation

**Confirmed:** the moderation UI belongs at `/admin` in `apps/web`; reusable
authentication and role policy belong in `packages/auth` (`@g13/auth`). See
[ADR 0004](../adr/0004-admin-auth-boundary.md). Public review submission remains
account-free and publishes immediately; moderation is subsequent, not an approval
queue. These placement decisions do not approve a password strategy.

**Proposed:** Better Auth with role-based authorization and D1-backed sessions is
architecturally feasible. Its supported Drizzle SQLite adapter matches the existing
D1 architecture. **Workers Free feasibility is not established:** the entire
HTTP invocation has a 10 ms CPU budget, not 10 ms per auth operation. Neither
password hashing nor the complete SSR/session/moderation path has been measured.
Do not promise that default password authentication fits this budget. [1–5]

If staying on Free is mandatory, prefer evaluating an existing-identity OAuth
provider for the small maintainer team, with public account creation blocked and
explicitly provisioned moderator access. Magic links are another candidate if an
email-delivery dependency is acceptable. Both avoid a local password KDF but
still require edge CPU measurements. If local passwords are required, recommend
Workers Paid plus measurement rather than weakening the password KDF. Provider,
login method, provisioning/bootstrap, and precise roles remain human decisions.

## Existing architecture

- Bun/Turborepo workspaces build shared packages to `dist`; application consumers
  import package exports, not source. Existing packages are `@g13/db`, `@g13/env`,
  `@g13/i18n`, and `@g13/curriculum`.
- `apps/web` uses TanStack Start and the Cloudflare Vite plugin. Wrangler specifies
  compatibility date `2026-10-19`, `nodejs_compat`, and the `DB` D1 binding. There
  is no existing auth/session provider or auth configuration. The production D1
  ID is still a placeholder; the account's actual billing plan is not established
  by Wrangler configuration.
- `packages/db/src/index.ts` constructs `drizzle-orm/d1` with a shared SQLite
  schema. The manifest requests `drizzle-orm ^0.45.1`; `bun.lock` and the installed
  package resolve **0.45.4**. There are no user/account/session/verification tables.
- `packages/db/schema.sql` is applied explicitly; the repository does not generate
  migrations while the schema is changing. Auth tables and plugin fields would
  need reviewed schema/SQL changes later, not a second persistence owner.
- `packages/env` currently validates the review rate-limit secret. It should own
  validation of future server-only auth configuration too. No `.env` secret values
  were read during this research.
- Feature handlers already construct request-dependent D1/environment objects
  inside handler bodies. Keep that boundary: the future shared auth package takes
  validated configuration/database dependencies; the app supplies runtime bindings
  and mounts the HTTP handler. Do not copy upstream module-scope `env.DB` examples
  into this app. [ADR 0003](../adr/0003-web-feature-ownership.md) and the
  [feature structure guide](../web-feature-structure.md) remain applicable.

## 1. What the Free CPU limit actually means

Cloudflare's current limits specify **10 ms CPU per HTTP request on Workers Free**.
The pricing page says **10 ms CPU per invocation**, with **100,000 requests/day**.
The budget covers all work executed by that Worker for the request, including
framework/SSR overhead, auth initialization, parsing, cryptography and policy
checks; it is not a per-user, daily CPU allowance or a 10 ms response deadline. [1,2]

Waiting for network I/O, such as D1 queries, KV reads or an OAuth/email service
request, does not count toward CPU time. Executing local code still does. HTTP
wall time has no hard limit while the client stays connected; `waitUntil()` can
extend work up to 30 seconds after response/disconnect, **not enlarge the CPU
budget**. An async function is not automatically exempt CPU work. Exceeding the
CPU limit can produce error 1102 / `exceededCpu`. [1]

Workers Paid costs a minimum **USD 5/account/month**. Standard pricing includes
10 million requests and 30 million CPU ms/month, then request/CPU overages. HTTP
CPU defaults to **30 seconds**, configurable up to **300,000 ms (5 minutes)**;
this is a different limit from included monthly CPU billing. Use a sensible CPU
ceiling and spending controls if choosing Paid. D1/email/provider costs and
quotas remain separate considerations. [1,2]

## 2. Password hashing: supported is not the same as cheap

Better Auth defaults to **scrypt**. It intentionally uses an expensive,
memory-hard password KDF. `emailAndPassword.password.hash` and `.verify` accept
custom async functions, but changing algorithms is not evidence of meeting the
Free CPU limit. Fast SHA-256/HMAC alone is not an acceptable password-hashing
substitute. The official Argon2 example uses a Node native addon; that example
is not proof of Workers compatibility. Cloudflare currently explicitly excludes
`node:crypto` Argon2 support. [3,6]

Version evidence matters here: latest published Better Auth release at research
time is **v1.7.25 (2026-11-14)**; its source delegates hashing to
`@better-auth/utils/password`, and its workspace pins utils **0.5.1**. That utils
release has a **`workerd` conditional export to its `node:crypto` scrypt
implementation**, as well as a pure-JavaScript `@noble/hashes` fallback for other
resolutions. Thus “Better Auth always uses pure-JS scrypt on Workers” is not a
correct current claim. Verify the actual bundled export when selecting versions.
Both implementations use `N = 16384`, `r = 16`, `p = 1`, derived key length 64,
a random 16-byte salt, and NFKC password normalization. The configured `maxmem`
is 64 MiB; the main scrypt memory term `128 × N × r` is about 32 MiB, **not a
measured total Worker memory footprint**. [4,7]

Cloudflare's current Node crypto docs support scrypt. In pinned workerd source,
the callback-style scrypt implementation calls the native KDF inside a Promise
executor; the callback shape does not prove Node/libuv offloading or a CPU
exemption on Workers. The source is evidence about implementation, not a timing
benchmark or proof of the exact runtime deployed to this account. Native crypto
can be faster than JS without meeting a 10 ms full-request budget. [6,8]

Account creation/reset/password change hash passwords; credential login verifies
them. Even creating the first password hash offline does not eliminate the KDF
on subsequent password logins. Low moderator traffic also does not remove the
per-invocation limit. **No timing claim is made here.**

## 3. Sessions: normally lookup, not password hashing or decryption

The normal `session_token` cookie is an **opaque, secret-signed session identifier**.
Better Auth verifies the signature and looks up the session/user in its configured
server-side store. Its session endpoint source calls `getSignedCookie` followed
by `internalAdapter.findSession` when not using cookie-cache data. This is not
“decrypt the user's password on every request,” and it does not rerun scrypt for
ordinary session authentication. Refresh can write an updated expiry. [9,10]

`session.cookieCache` is a separate, opt-in `session_data` cookie. It is core
session configuration, **not a required caching plugin**. Strategies are:

- `compact` (default cache strategy): base64url payload plus HMAC-SHA256 signature.
- `jwt`: signed JWT, normally HS256; not encryption.
- `jwe`: encrypted JWE; adds encryption/decryption work.

The JWT plugin is not required for normal opaque sessions or compact caching.
Secondary storage (for example KV) is another option, not a requirement; D1 is
already available. Do not add storage/plugins solely to avoid an unmeasured CPU
cost. [9,10]

Cookie caching can retain revoked sessions and stale role data until cache expiry.
For moderator inspection and mutations, recommend database-backed authoritative
session/role checks with cookie caching disabled (or explicitly bypassed using
`disableCookieCache: true`). Revocation and demotion must take effect on the next
protected request. Fewer D1 round trips are not worth silently weakening this
requirement. D1 wait time is not CPU, though query handling and application work
still are. This remains a recommendation to verify, not an implemented policy.
[1,9]

## 4. D1 / Drizzle / TanStack compatibility

The official Drizzle adapter supports `provider: "sqlite"` and explicit schema
mapping. Better Auth includes a first-party Workers/D1 smoke-test fixture. Its
v1.7.25 Drizzle adapter peer range is `^0.45.2 || >=1.0.0-rc.1 <2.0.0`, which
includes this checkout's locked Drizzle 0.45.4. These establish a credible
integration path, **not a tested integration in this repo or Free-tier CPU
certification**. Use the existing Drizzle/D1 connection rather than adding a
parallel database client. [5,11]

Keep adapter `transaction` disabled for D1: Better Auth documents that D1 does not
support its interactive transaction path. This does **not** mean D1 has no atomic
operations: D1's prepared-statement `batch()` is transactional, but that is not
Drizzle's interactive `db.transaction(...)` interface. Test selected auth flows'
failure behavior rather than assuming multi-step auth writes are atomic. Keep
optional joins off unless there is a measured need and required relations. [3,5,12]

TanStack Start has an official integration: mount Better Auth's handler on a
server route (normally `/api/auth/$`), independently of the `/admin` UI location.
The framework-specific cookie plugin is useful when server functions call APIs
that set cookies; it is not a session-decryption requirement. Every moderation
server function needs its own session/permission check; a route redirect or
hidden navigation item is insufficient. Keep framework cookie/request wiring in
the web app and reusable auth/role policy in the shared package. [13]

## 5. Roles and closed moderator accounts

Better Auth's **Admin plugin** provides roles and account/session administration;
it does not build this app's `/admin` UI or automatically authorize custom review
RPCs. Its defaults are `admin` and `user`; a least-privilege `moderator` role with
review inspect/hide/restore/soft-delete permissions is a **proposal**, not a
confirmed role matrix. Its access-control API supports custom resources/actions.
Do not grant ordinary moderators account creation, role changes, impersonation
or other user-management rights merely because the plugin offers them. [14]

A closed-account design is possible, but must cover **every enabled login path**:

- Email/password: `emailAndPassword.disableSignUp: true`.
- OAuth: provider-specific `disableSignUp` / `disableImplicitSignUp` options;
  email/password's setting does not govern OAuth registration. Existing account
  linking must be restricted and tested against the selected provider's verified
  identity semantics.
- Magic link / email OTP: plugin-specific `disableSignUp: true`, because both
  otherwise automatically create users.
- Admin plugin: an authorized administrator can create users, including users
  without a credential password for a passwordless/social-only flow. Initial
  privileged bootstrap is a separate operational step; the current docs provide
  `auth create-admin`, but its D1 runtime/configuration must be verified before
  choosing it as this project's bootstrap procedure. Never expose a public
  bootstrap endpoint. [3,14–17]

**Unresolved:** who provisions moderators, how the first administrator is created,
manual creation versus invitations, identity linking, recovery/offboarding, and
who can assign roles. Admin `createUser` is not by itself an end-to-end invite
workflow. Suggested starting point is owner-controlled provisioning with no public
registration, then approved moderators sign in using the selected method. This
suggestion does not authorize implementation or resolve the owner decision.

Auth configuration also needs a server-only secret, explicit production base URL
and trusted origins, secure/HttpOnly cookies, intact CSRF protections, and trusted
Cloudflare IP handling for rate limits. Existing review IP hashing is not an auth
session policy: Better Auth's session schema includes IP/user-agent fields, so
choose their retention/privacy policy explicitly. Auth protection must not be
accidentally applied to anonymous public submissions. [9,10,18]

## 6. Alternatives and choices still needed

- **OAuth (recommended candidate if Free is mandatory):** no local password KDF;
  depends on the identity provider, app credentials, callback/linking policy and
  existing-account provisioning. OAuth still uses crypto, database work and
  framework CPU. Decide which provider maintainers can actually use. [16]
- **Magic link / email OTP:** no password KDF for login; requires reliable email
  delivery, anti-abuse controls, expiring single-use tokens/codes and mailbox-based
  recovery. Disable automatic signup; do not assume the email service is free.
  [15,17]
- **Passkeys:** avoid password KDF and provide WebAuthn-based authentication;
  require supported authenticators and a secure initial-enrolment/recovery flow.
  Better Auth's passkey plugin does not decide how the first privileged identity
  is provisioned. Signature verification still consumes work. [19]
- **Local passwords on Paid:** retains familiar credentials and avoids the tight
  Free CPU ceiling; accepts the account subscription and ongoing password/reset
  security responsibilities. Measure and set operational limits. [1–4]
- **Separate hosted auth/compute:** can move expensive credential verification
  elsewhere, at the cost of another deployment/provider/trust boundary. It is a
  fallback architectural choice, not a reason to add a custom crypto service now.

Before marking #27 ready, a human must choose **Free versus Paid**, login method
and provider, provisioning/bootstrap/recovery owner/process, and the permission
matrix. If the Free constraint is firm, verify the selected flow on the deployed
Workers runtime using Cloudflare invocation CPU metrics, not local wall-clock
timers: successful/failed/unknown-user sign-in, account creation/reset if enabled,
OAuth or token callbacks, session lookup/refresh/revocation, `/admin` SSR, and every
moderation RPC. Include cold/warm invocations and room for framework overhead;
record package versions, crypto export resolution and observed CPU distributions.
A local Bun benchmark or low average CPU is not proof that all Free requests fit.
No such benchmark or deployment was performed in this research. [1]

## Primary sources

Accessed 2026-11-15. Better Auth docs/source were checked at upstream commit
`8382ce613f04bf590d3cb6c1363dfd0e41110944`; release session/admin/Drizzle docs and
session endpoint were also compared with v1.7.25 (identical at those paths).
Version-specific implementation claims below link to release or pinned source.

1. Cloudflare, [Workers limits: CPU, duration and metrics](https://developers.cloudflare.com/workers/platform/limits/#cpu-time).
2. Cloudflare, [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/#workers).
3. Better Auth, [email/password: hashing, configuration and transaction caveats](https://www.better-auth.com/docs/authentication/email-password#password-hashing).
4. Better Auth, [v1.7.25 release](https://github.com/better-auth/better-auth/releases/tag/v1.7.25), [password implementation](https://github.com/better-auth/better-auth/blob/v1.7.25/packages/better-auth/src/crypto/password.ts), [utils dependency pin](https://github.com/better-auth/better-auth/blob/v1.7.25/pnpm-workspace.yaml).
5. Better Auth, [Drizzle adapter](https://www.better-auth.com/docs/adapters/drizzle), [v1.7.25 adapter dependencies](https://github.com/better-auth/better-auth/blob/v1.7.25/packages/drizzle-adapter/package.json).
6. Cloudflare, [Node crypto support and exclusions](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [Web Crypto support](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/).
7. Better Auth utils v0.5.1, [conditional exports](https://github.com/better-auth/utils/blob/6023d122c770f02e258a941abbc6ef172f2e16b1/package.json), [native scrypt](https://github.com/better-auth/utils/blob/6023d122c770f02e258a941abbc6ef172f2e16b1/src/password.node.ts), [JS fallback](https://github.com/better-auth/utils/blob/6023d122c770f02e258a941abbc6ef172f2e16b1/src/password.ts).
8. Cloudflare workerd, [scrypt callback implementation](https://github.com/cloudflare/workerd/blob/a04c4418e912a8ebcf5aa8c5b1d2993496c2e396/src/node/internal/crypto_scrypt.ts#L151-L190), [native KDF call](https://github.com/cloudflare/workerd/blob/a04c4418e912a8ebcf5aa8c5b1d2993496c2e396/src/workerd/api/node/crypto.c%2B%2B#L90-L105).
9. Better Auth, [sessions, cache strategies and revocation limitations](https://www.better-auth.com/docs/concepts/session-management), [v1.7.25 session endpoint](https://github.com/better-auth/better-auth/blob/v1.7.25/packages/better-auth/src/api/routes/session.ts).
10. Better Auth, [opaque signed session cookie versus optional cache](https://www.better-auth.com/docs/concepts/cookies).
11. Better Auth, [first-party Cloudflare/D1 fixture](https://github.com/better-auth/better-auth/blob/8382ce613f04bf590d3cb6c1363dfd0e41110944/e2e/smoke/test/fixtures/cloudflare/src/auth.ts).
12. Cloudflare, [D1 database batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch); official [documentation source](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/d1/worker-api/d1-database.mdx).
13. Better Auth, [TanStack Start integration and protected server functions](https://www.better-auth.com/docs/integrations/tanstack).
14. Better Auth, [Admin plugin, access control and provisioning](https://www.better-auth.com/docs/plugins/admin), [create-user implementation](https://github.com/better-auth/better-auth/blob/8382ce613f04bf590d3cb6c1363dfd0e41110944/packages/better-auth/src/plugins/admin/routes.ts#L248-L484).
15. Better Auth, [Magic Link options and signup default](https://www.better-auth.com/docs/plugins/magic-link).
16. Better Auth, [social provider signup options](https://www.better-auth.com/docs/reference/options#socialproviders), [GitHub OAuth setup](https://www.better-auth.com/docs/authentication/github), [account linking](https://www.better-auth.com/docs/concepts/users-accounts#account-linking).
17. Better Auth, [Email OTP options and signup default](https://www.better-auth.com/docs/plugins/email-otp).
18. Better Auth, [security: CSRF, origins, IP trust and rate limiting](https://www.better-auth.com/docs/reference/security). Its generic statement that secure cookies are encrypted is broader than actual session behavior; use the cookie/session docs and source in [9,10] for the precise semantics.
19. Better Auth, [Passkey plugin](https://www.better-auth.com/docs/plugins/passkey).
