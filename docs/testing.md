# Testing

`e2e/theme.e2e.ts` checks the theme reveal in both directions, system preference
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
return, and preserving filter values when resizing to the desktop panel. They verify rendered arrow paths
and arrowheads as well as course selection. Drawer tests verify opening and closing
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
