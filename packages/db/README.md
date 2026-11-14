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
