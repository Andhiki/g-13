# Database

The feature-owned Drizzle schemas in `src/schema/` are canonical. From the
workspace root, run `bun run db:generate` to generate versioned SQLite
migrations and Drizzle snapshots in `migrations/`. Wrangler applies those
migrations explicitly with `bun run db:migrate:local` or
`bun run db:migrate:remote`; deployment does not run schema changes
automatically.

The initial migration creates the schema for a fresh D1 database. The current
local and production database state has not been verified. Existing data needs
an approved backup and baseline plan before applying migrations; do not stamp
`d1_migrations` manually or reset data to make the initial migration apply.

Before deploying, create the D1 database in Cloudflare and replace the local
placeholder `database_id` in `apps/web/wrangler.jsonc` with its ID. Seed the
lecturer and course catalog separately after migrating: run `bun run db:seed`
for local D1, or apply `packages/db/seed.sql` with Wrangler's `d1 execute
--remote` for the production database. The lecturer names are drawn from DIKE
UGM's public faculty directory. Review
courses form a separate bilingual catalog, with `name_id` and `name_en` retained
on each record.

## Review submissions

Set the server-only `REVIEW_RATE_LIMIT_SECRET` to a random secret of at least 32
characters (Wrangler secret in production; `apps/web/.env` locally, copied from
`.env.example`). Do not also create `.dev.vars`, which prevents Cloudflare from
loading `.env`. `packages/env` validates runtime secrets. Never expose the secret
to the browser. Submissions fail closed without it or a trusted client IP.
Cloudflare supplies `CF-Connecting-IP`; local development uses loopback. Do not
serve this handler behind a proxy that allows visitors to forge that header.

The limits are three validated review submissions and 60 like actions per IP per
UTC clock hour, shared across workers through an atomic D1 upsert. Likes use a
random identifier stored in the browser; clearing storage allows another like.
Failed writes may consume an attempt. Only a window-specific HMAC and counter are
stored separately from reviews. Expired
counters are deleted on subsequent valid submission activity; a quiet deployment
may retain expired hashes until the next submission. Raw IPs are not stored here;
infrastructure logging has separate retention. Secret rotation resets limits.
Tests initialize ephemeral D1 databases from the generated migrations.

Public launch requires a production D1 database with migrations and seed applied,
the server-only rate-limit secret, and a named human owner ready to review reports
and remove content promptly. These are operational launch requirements; the
lecturer review pages and actions are always available in the application.
Retention decisions remain open in #26; moderator authentication decisions still
need resolution in #27.
