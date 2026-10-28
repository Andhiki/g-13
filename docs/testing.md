# Testing

## GitHub CI

`.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and manual
dispatch. The `Quality checks` job runs `bun run check` and `bun run build`.

## Local checks

Run commands from the repository root. Turbo builds the shared curriculum
package before consumer tests and type checking. Package tests also exercise the
built public DAL; source-specific checks remain beside each curriculum slice.

Run `bun run check` for lint, formatting, type checking, and the Bun suite. Run
`bun run build` to verify the production client and server bundles.

The Bun tests cover curriculum source data, URL validation, filtering, list
grouping, roadmap planning, and prerequisite relationships. They test application
and curriculum behavior without asserting rendered UI or browser layout.
