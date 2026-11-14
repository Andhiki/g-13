# Database

Drizzle defines the shared SQLite schema used with Cloudflare D1. The checked-in
`schema.sql` is applied directly to Wrangler's local D1 while the schema is still
changing; it is not a generated migration.

From the workspace root, run `bun run db:push` to create or update the local
tables and `bun run db:seed` to refresh the initial professor and course catalog.
The professor names are drawn from DIKE UGM's public faculty directory. Review
courses form a separate bilingual catalog, with `name_id` and `name_en` retained
on each record.

Before deploying, create the D1 database in Cloudflare and replace the local
placeholder `database_id` in `apps/web/wrangler.jsonc` with its ID. Apply the
same schema and seed SQL to that D1 database explicitly; deployment does not run
schema changes automatically.

## Review submissions

Set the server-only `REVIEW_RATE_LIMIT_SECRET` to a random secret of at least 32
characters (Wrangler secret in production; `.dev.vars` locally). Never expose it
to the browser. Submissions fail closed without it or a trusted client IP.
Cloudflare supplies `CF-Connecting-IP`; local development uses loopback. Do not
serve this handler behind a proxy that allows visitors to forge that header.

The limit is three validated attempts per IP per UTC clock hour, shared across
workers through an atomic D1 upsert. Failed writes may consume an attempt. Only
a window-specific HMAC and counter are stored separately from reviews. Expired
counters are deleted on subsequent valid submission activity; a quiet deployment
may retain expired hashes until the next submission. Raw IPs are not stored here;
infrastructure logging has separate retention. Secret rotation resets limits.
No migrations are generated. Apply `schema.sql` locally before testing.

Launch remains blocked by #26 (human owner, takedown and retention decisions)
and a real production D1 ID. #27 still needs moderator authentication decisions.
