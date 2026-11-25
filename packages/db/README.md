# Database

The feature-owned Drizzle schemas in `src/schema/` are canonical. From the
workspace root, run `bun run db:generate` to generate versioned SQLite
migrations and Drizzle snapshots in `migrations/`.

Migrations are applied automatically by the deploy command in Workers Builds:
`bun run db:migrate` reads the target database from the `D1_DATABASE_ID`
environment variable and refuses to run without it. Local development uses
`bun run db:migrate:local`. Do not apply migrations manually against staging or
production unless you are intentionally recovering from a failed deploy.

The initial migration creates the schema and seeds the reference lecturer and
course catalog, so every fresh database gets both on first migration.
`packages/db/seed.sql` is reserved for local-only fixtures.

The lecturer list is scraped from DIKE UGM's public faculty directory
(https://dcse.fmipa.ugm.ac.id/dosen/, reviewed 2026-11-20). Review courses form
a separate bilingual catalog, with `name_id` and `name_en` retained on each
record.

## Review submissions

Set the server-only `REVIEW_RATE_LIMIT_SECRET` to a random secret of at least 32
characters (Wrangler secret in production; `apps/web/.env` locally, copied from
`.env.example`). Do not also create `.dev.vars`, which prevents Cloudflare from
loading `.env`. `packages/env` validates runtime secrets. Never expose the secret
to the browser. Submissions fail closed without it or a trusted client IP.
Cloudflare supplies `CF-Connecting-IP`; local development uses loopback. Do not
serve this handler behind a proxy that allows visitors to forge that header.

Submissions are also gated by Cloudflare Turnstile (invisible widget). Set
`TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` from the same widget; verification is
fail-closed, so reviews are rejected when the secret is missing or Siteverify fails.
See [docs/lecturer-reviews.md](../../docs/lecturer-reviews.md).

The submission limit is three validated reviews per browser per UTC hour, with a
20-submissions-per-IP hourly backstop. Likes remain 60 per IP per UTC hour.
Counters are shared across workers through atomic D1 upserts. Reviews and likes
use a random browser identifier; clearing storage allows another like and starts
a fresh submission bucket, while the IP backstop still applies. Without a browser
identifier, submissions fall back to three per IP per hour. Failed writes may
consume an attempt. Only a window-specific HMAC and counter are stored separately
from reviews. Expired counters are deleted on subsequent valid submission
activity; a quiet deployment may retain expired hashes until the next submission.
Raw IPs are not stored here; infrastructure logging has separate retention.
Secret rotation resets limits. Tests initialize ephemeral D1 databases from the
generated migrations.

Public launch requires a production D1 database with migrations and seed applied,
the server-only rate-limit secret, and a named human owner ready to review reports
and remove content promptly. These are operational launch requirements; the
lecturer review pages and actions are always available in the application.
Retention decisions remain open in #26; moderator authentication decisions still
need resolution in #27.
