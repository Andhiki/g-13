# Research: server-function handler import patterns (TanStack Start + Cloudflare Workers)

Question: can `apps/web/src/features/lecturer-reviews/server/handler.ts` use plain
**static** imports for `cloudflare:workers` `env`, `@g13/db` `createDatabase`,
`@g13/env` parsing, and `.service` modules, instead of the current dynamic
`import()` inside every handler — without leaking server code into the client
bundle?

Research only; the uncommitted implementation was not modified. All claims below
were verified against the **installed** package source (not just docs) plus an
empirical build/dev experiment on a throwaway copy of the app (deleted afterwards).

## Versions verified

| Package | Installed |
| --- | --- |
| `vite` | 8.3.5 (Rolldown-based) |
| `@tanstack/react-start` | 1.169.4 (`start-plugin-core` 1.169.4, `router-core` 1.171.39) |
| `@tanstack/react-router` | 1.170.46 |
| `@cloudflare/vite-plugin` | 1.66.0 (wrangler 4.154/4.155, workerd 1.20261023.1) |
| `wrangler.jsonc` | `compatibility_date` 2026-10-19, `viteEnvironment: { name: "ssr" }` |

Docs fetched from TanStack `main` (2026-11-14); behavior was cross-checked
against installed 1.169.4 source, which is the binding evidence.

## Answer: yes, static imports are safe — with one rule

Static top-level imports referenced **exclusively inside `createServerFn`
handlers** are stripped from the client and SSR-caller builds by the Start
compiler. Verified three ways:

1. **Installed compiler source** (`@tanstack/start-plugin-core/dist/esm/start-compiler/`):
   - `handleCreateServerFn.js` replaces each `.handler(fn)` with
     `createClientRpc(id)` (client env) / `createSsrRpc(id)` (SSR caller env) and
     keeps the real handler only in the split provider module
     (`handler.ts?tss-serverfn-split`), which is compiled only for the provider
     environment.
   - `compiler.js` then runs `deadCodeElimination(ast, refIdents)`
     (`babel-dead-code-elimination`), which removes import specifiers whose only
     references were inside the removed handler bodies. This cuts the whole
     transitive subgraph (handler → service → repository → drizzle) out of the
     client graph at the first edge.
   - In dev, the same compiler transform runs per environment, so the module the
     browser loads contains only RPC stubs (verified live, below).
2. **Official docs** state this explicitly
   ([Import Protection → "Common Pitfall: Why Some Imports Stay Alive"](https://tanstack.com/start/latest/docs/framework/react/guide/import-protection)):
   "when the compiler replaces a `createServerFn()` handler with a client RPC
   stub, it can also remove server-only imports that were only used by the
   removed implementation", and
   [Server Functions → "Static Imports Are Safe"](https://tanstack.com/start/latest/docs/framework/react/server-functions):
   "The build process replaces server function implementations with RPC stubs in
   client bundles. The actual server code never reaches the browser."
3. **Empirical test** (scratch copy of `apps/web`, repo untouched): with the
   handler rewritten to static imports —
   - `vite build` succeeds (control build with current dynamic imports also
     succeeds);
   - client output (`dist/client/assets/*`): zero occurrences of
     `cloudflare:workers`, `createDatabase`, `getLecturerDirectory`,
     `submitReview`, `parseSubmissionEnvironment`, `REVIEW_RATE_LIMIT_SECRET`,
     `cf-connecting-ip`, `getRequest`, `drizzle`; server functions appear only as
     opaque `/_serverFn/<sha256-id>` URLs;
   - server output contains the provider module with `cloudflare:workers` and
     all service code;
   - dev server SSR renders the lecturers page, and the dev-served client module
     of `handler.ts` contains only `createClientRpc(...)` stubs — no server
     imports at all.

## Filename enforcement (`.server.ts`) and `createServerOnlyFn`

- **Import protection is on by default** and denies, in the client environment:
  files matching `**/*.server.*` and the specifier `@tanstack/react-start/server`;
  in the server environment: `**/*.client.*` (`node_modules` excluded).
  Dev behavior is `mock` (warn + mock module), build behavior is `error`.
  Source: `start-plugin-core/dist/esm/import-protection/defaults.js` + docs above.
- **Build violations are verified against tree-shaking**: in build mode the
  plugin defers violations, replaces the denied import with a mock module, and at
  `generateBundle` errors only if the mock (or importer) survived tree-shaking.
  So a `.server` import used *only inside handlers* never trips it; one referenced
  outside handlers fails the build with a trace and suggestions. Source:
  `vite/import-protection-plugin/plugin.js` (`deferredBuildViolations`,
  `generateBundle`), confirmed empirically (leaky export → build error).
- **`createServerOnlyFn`** (exported from `@tanstack/react-start`) is compiled by
  `handleEnvOnlyFn`: on the server env it becomes the inner function; on the
  client env it becomes `() => { throw ... }`, and DCE removes imports referenced
  only inside its callback. Runtime stub is identity
  (`@tanstack/start-fn-stubs`), so all enforcement is compile-time. Docs:
  [Environment Functions](https://tanstack.com/start/latest/docs/framework/react/guide/environment-functions).
  Use it for server-only helpers that must not even be *callable* from the
  client; plain handler-local usage needs nothing extra.
- **File markers**: `import '@tanstack/react-start/server-only'` marks any file
  (e.g. one not following the `.server.*` naming) as server-only.
- Note: `.validator()` calls are also stripped from the client build
  (`stripMethodCall` in `handleCreateServerFn.js`), so schema imports used only in
  validators don't ship either.

## The one rule the empirical test caught

**Never import `createServerFn` itself from `@tanstack/react-start/server`.**
That specifier is denied in the client environment, and `createServerFn` is still
needed by the client stub, so the import stays alive and the build fails with
`[import-protection] Import denied in client environment` (reproduced). Split it:

```ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server"; // stripped on client
```

## Cloudflare-specific caveats

- `cloudflare:workers` is a builtin/external **only in the Cloudflare worker
  environment** (`resolve.builtins` in `@cloudflare/vite-plugin`; this app merges
  the worker into the `ssr` environment via `viteEnvironment: { name: "ssr" }`,
  which is also the Start **provider** environment by default — `ssrIsProvider:
  true`). In the client environment it is not resolvable; safety relies entirely
  on the compiler stripping the import. If it is ever referenced outside a
  handler in client-reachable code, the build fails with a raw Rolldown
  resolution error (reproduced) — loud, but the "add it to
  build.rolldownOptions.external" hint in that message is misleading; the fix is
  moving the reference inside a handler.
- **Unprotected packages leak silently**: `@g13/db`, `@g13/env`, `drizzle-orm`
  are not covered by any default deny rule (workspace packages, no `.server.*`
  filenames). Referenced outside handlers in client-reachable code, they would be
  bundled into the client with **no error**. Optional hardening (not required for
  the current handler): add `client.files: ['**/*.server.*', '**/features/**/server/**']`
  or a `client.specifiers: ['@g13/db']` deny rule, or `import
  '@tanstack/react-start/server-only'` markers in `packages/db`.
- **Transitive-import bug report**: TanStack/router#7199 claimed
  `cloudflare:workers` breaks the client bundle when imported by a *dependency*
  of a server fn ("tree shaking only works at 1 level depth", start 1.167.x).
  Closed as no-repro. Not reproducible on 1.169.4: the empirical static-import
  build cuts handler → `read.service` → `repository` → `@g13/db`/drizzle out of
  the client entirely. This repo's services already take `db` as a parameter, so
  `cloudflare:workers` is imported only in `handler.ts` itself.
- **Typing**: `@cloudflare/workers-types` declares
  `declare module "cloudflare:workers" { export const env: Cloudflare.Env }`, and
  `apps/web/src/env.d.ts` augments `Cloudflare.Env` with `DB: D1Database` — a
  static `import { env } from "cloudflare:workers"` is fully typed today.
- **Static prerendering** (not enabled in this app): server functions executed at
  build time run in Node, where `cloudflare:workers` does not exist. If
  prerendering/ISR is ever enabled for routes whose loaders call these functions,
  this needs re-checking (uncertain, untested here).
- Official first-party pattern matches: the TanStack
  [`start-basic-cloudflare` example](https://github.com/TanStack/router/tree/main/examples/react/start-basic-cloudflare)
  statically imports `env` from `cloudflare:workers` in a route file and uses it
  only inside a handler.

## Options compared

1. **Static imports in `handler.ts` (recommended)** — simplest; exactly the
   documented and first-party-exampled pattern; compiler strips everything;
   zero new abstractions. Matches `docs/web-feature-structure.md` ("load database
   or runtime-only modules inside the server handler" — the handler *file* is the
   boundary; the compiler enforces the rest).
2. **One `.server.ts` dependency/context helper** (e.g. `server/db.server.ts`
   exporting `getDb()`) — only worth it if several features need identical
   wiring; today one feature uses the DB, so it is an extra layer with no
   second consumer. Revisit when a second feature needs D1.
3. **Middleware** (`createMiddleware({ type: 'function' }).server(...)` providing
   `{ db }` via `next({ context })`) — legitimate for genuinely cross-cutting
   per-request context (auth, tracing), but for db construction it adds a
   middleware attachment to every server function and context typing for no
   behavioral gain here. Not recommended now.

## Recommended handler sketch

```ts
// apps/web/src/features/lecturer-reviews/server/handler.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db";
import { parseSubmissionEnvironment } from "@g13/env";
import { reviewClientIp } from "../../../server/request-identity";
import {
  browserLikesInputSchema,
  lecturerDetailInputSchema,
  publishReviewInputSchema,
  reviewLikeInputSchema,
  validateRpcInput,
} from "../shared/schemas";
import { getLecturerDetail, getLecturerDirectory } from "./read.service";
import { getBrowserReviewLikes } from "./repository";
import { setReviewLike } from "./likes.service";
import { submitReview } from "./submission.service";

export const loadLecturerDirectory = createServerFn({ method: "GET" }).handler(async () => {
  return getLecturerDirectory(createDatabase(env.DB));
});

export const loadLecturerDetail = createServerFn({ method: "GET" })
  .validator((input: unknown) => validateRpcInput(lecturerDetailInputSchema, input))
  .handler(async ({ data }) => {
    if (!data.valid) return null;
    return getLecturerDetail(createDatabase(env.DB), data.data.lecturerId);
  });

export const publishLecturerReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => validateRpcInput(publishReviewInputSchema, input))
  .handler(async ({ data }) => {
    if (!data.valid) return { ok: false as const, error: "invalid" as const };
    const { REVIEW_RATE_LIMIT_SECRET: secret } = parseSubmissionEnvironment(env);
    const ip = reviewClientIp(getRequest());
    return submitReview(createDatabase(env.DB), data.data, { ip, secret });
  });

export const loadBrowserLikes = createServerFn({ method: "POST" })
  .validator((input: unknown) => validateRpcInput(browserLikesInputSchema, input))
  .handler(async ({ data }) => {
    if (!data.valid) return [];
    return getBrowserReviewLikes(createDatabase(env.DB), data.data.browserId);
  });

export const updateReviewLike = createServerFn({ method: "POST" })
  .validator((input: unknown) => validateRpcInput(reviewLikeInputSchema, input))
  .handler(async ({ data }) => {
    if (!data.valid) return { ok: false as const, error: "invalid" as const };
    const { REVIEW_RATE_LIMIT_SECRET: secret } = parseSubmissionEnvironment(env);
    const ip = reviewClientIp(getRequest());
    return setReviewLike(createDatabase(env.DB), data.data, { ip, secret });
  });
```

Rules that keep this safe (verified empirically):

- Every server-only import is referenced **only inside `.handler()` bodies**
  (validators may also use shared schemas — those stay client-safe anyway).
- `createServerFn` comes from `@tanstack/react-start`, never from
  `@tanstack/react-start/server`.
- Callers keep **statically** importing `handler.ts`
  (`client/queries.ts`, `client/mutations.ts` already do). Dynamic
  `import()` of a server-function module is warned against by the docs
  ("can cause bundler issues").
- Don't add exports from `handler.ts` that touch server-only imports outside a
  handler; if needed, wrap them in `createServerOnlyFn` or move them to a
  `.server.ts` file.

## Uncertainty / version notes

- Verified against installed 1.169.4 + Cloudflare plugin 1.66.0. Docs fetched
  from TanStack `main`; if either is upgraded, re-check the "Common Pitfall"
  section of the import-protection doc — the pruning behavior is a compiler
  guarantee, not a language guarantee.
- Dev-mode import protection can report false-positive warnings that build mode
  would clear (documented); none were observed in the dev smoke test of this
  exact pattern.
- TanStack/router#7199 (transitive `cloudflare:workers` import) is closed as
  no-repro; not reproducible on the installed version, but it is the closest
  known issue — if a future upgrade reintroduces it, the failure is a loud
  client-build resolution error, not a silent leak.

## Build verification needed before implementation?

**Yes, run `bun run build` (apps/web) after switching to static imports** — the
switch itself was build- and dev-verified on a scratch copy of this exact app
state (both pass, zero client leakage), but the real tree's final state should be
verified once, since the current tree has uncommitted work in flight. The
control (dynamic-import) build also passes, so any new failure after the switch
would come from the switch.

## Sources

- Installed source (binding for versions above):
  - `node_modules/@tanstack/start-plugin-core/dist/esm/start-compiler/handleCreateServerFn.js` (handler replacement, validator stripping, provider split)
  - `node_modules/@tanstack/start-plugin-core/dist/esm/start-compiler/compiler.js` (DCE after rewrite)
  - `node_modules/@tanstack/start-plugin-core/dist/esm/start-compiler/handleEnvOnly.js` (createServerOnlyFn transform)
  - `node_modules/@tanstack/start-plugin-core/dist/esm/import-protection/defaults.js` and `dist/esm/vite/import-protection-plugin/plugin.js` (deny rules, deferred build verification)
  - `node_modules/@cloudflare/vite-plugin/dist/index.mjs` (`cloudflareBuiltInModules`, worker/ssr environment options)
  - `node_modules/@cloudflare/workers-types/index.d.ts` (`cloudflare:workers` module typing)
- TanStack Start docs (fetched 2026-11-14 from `TanStack/router@main`):
  - https://tanstack.com/start/latest/docs/framework/react/server-functions
  - https://tanstack.com/start/latest/docs/framework/react/guide/import-protection
  - https://tanstack.com/start/latest/docs/framework/react/guide/environment-functions
  - https://tanstack.com/start/latest/docs/framework/react/guide/hosting (Cloudflare setup, first-party example link)
  - https://tanstack.com/start/latest/docs/framework/react/guide/middleware
- First-party example: https://github.com/TanStack/router/tree/main/examples/react/start-basic-cloudflare (static `env` import in `src/routes/index.tsx`)
- Cloudflare docs: https://developers.cloudflare.com/workers/vite-plugin/reference/vite-environments/ (TanStack Start `viteEnvironment: { name: "ssr" }` integration)
- TanStack/router#7199 (closed, no repro): https://github.com/TanStack/router/issues/7199
