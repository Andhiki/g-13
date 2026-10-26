# Testing

## GitHub CI

`.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and manual
dispatch. `Quality checks` runs the local check command and production build.
`Browser tests` runs independently with Chromium at desktop and mobile sizes;
Playwright's web-server command builds its own production preview. Focused
`.only` tests fail CI. The browser suite has a 15-minute global timeout within
a 20-minute job so reports can finish uploading.

Download `playwright-results` from the workflow run for the HTML report and
failure traces (retained for seven days). These artifacts may contain rendered
page content; use synthetic/public data in tests. Neither job uses deployment
secrets. Require both job checks in the `main` ruleset after the first run.

## Local checks

`e2e/theme.e2e.ts` checks the theme reveal in both directions, saved preference
updates, persistence, focus return, reduced motion, and missing View Transitions
support on desktop and phone sizes.

Run `bun run check` for lint, formatting, type checking, and the Bun suite. Run
`bun run build` to verify the production client and server bundles.

The Bun tests cover source-data preservation, valid and invalid direct links,
semester and interest filtering, duplicate-free list grouping, and selection with
prerequisite and follow-on relationships using both real curricula. Small helper
functions are covered through these behaviors rather than separate tests of each
branch or exact layout coordinates.

Run browser regressions with:

```sh
bunx playwright install chromium
bun run test:browser
```

Playwright builds the app and starts a dedicated production preview on port 5180 and runs both curricula at
desktop and phone sizes. The tests use real mouse and keyboard interactions to
open course details, follow prerequisites, restore direct links after reload,
open search with `/` without inserting it into the query, type normally in the
search field, dismiss empty results, select search results, switch to the list,
filter semesters, and persist the dark theme. Filter-drawer tests also check
curriculum and interest selection, retained required courses, dismissal and focus
return, and preserving filter values when resizing to the desktop panel. They verify rendered connector paths
and course selection. Drawer tests verify opening and closing
animation events and dismissal in both map and list views. Traces are retained for failures in
`test-results/`.

Browser tests are separate from `check` because they require a Chromium install
and its runtime libraries. When local browser libraries are missing, follow the
scoped runtime fallback in `AGENTS.md`; do not add machine-specific library paths
to the project configuration.

`e2e/drawer.e2e.ts` observes real CSS animation events for both map and list
course details, checks their opening and closing directions at desktop and phone
sizes, and verifies reduced-motion dismissal. It catches missing nonmodal motion
and premature unmounting before the exit animation.

The roadmap tests exercise the planner and URL boundary with both real curricula.
They check required-credit totals, unique courses, every peminatan under both
exposure semesters and graduation targets, internship tiers, unresolved recognition,
source prerequisite conflicts, protected courses, and edited-plan restoration.
`e2e/roadmap.e2e.ts` covers the full-screen quiz, conditional follow-ups, Back,
browser history, course replacement, exposure controls, and clipboard fallback at
both viewport sizes. The fallback must disappear when the displayed plan changes.

`e2e/routing.e2e.ts` checks both curricula at desktop and phone sizes. It samples
rendered SVG paths against unrelated node bounds, checks that every edge renders,
and repeats the roadmap check after changing the graduation target.

The routing tests also sample animation frames on both maps to verify that
prerequisite connections finish before outgoing connections begin.
