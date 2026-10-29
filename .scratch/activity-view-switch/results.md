# Activity view-switch experiment

Branch: `experiment/activity-view-switch`.
Baseline: `a4e73cb9b6895ca5a57df60a6c21bcf9af5f155d`.
Candidate: `9caf3ce9acd7eac8bf03c29d14166443538522e6`.

Acceptance: preserve graph/list behavior while simplifying visibility handling.

## Candidate

Wrapped the graph and list in React Activity boundaries. Removed the graph's opacity,
aria-hidden, inert, and active prop/guard. The production change removed eight net
lines across CurriculumPage and CurriculumMap (30 additions, 38 deletions).

## Browser comparison

Chromium, 1440x1000 and 390x1000. The same tests exercise three repeated switches,
zooming and panning, hidden graph controls, filter placement, node identity, viewport
restoration, routing jobs, selected-course details, and keyboard switching after
semester navigation.

The baseline passed all four cases. The candidate failed viewport restoration on
both screen sizes after the first list-to-map switch. An earlier run also confirmed
that React Flow recreated graph nodes on reveal. Reordering the assertions to check
the viewport before node identity reproduced the visible regression independently
of the DOM-identity assertion.

The candidate's desktop selected-course case passed. Its mobile selected-course
case timed out opening details before switching, so that result does not establish
an Activity switching regression. The two reproducible viewport failures alone
reject parity.

Both candidate `bun run check` and `bun run build` passed. Static checks do not cover
the effect lifecycle involved here.

## Cause and decision

The installed @xyflow/react StoreUpdater effect cleanup resets its external store.
Its pan/zoom effect cleanup also destroys its controller. Activity invokes those
cleanups on hide; React state preservation does not preserve that external store.
GraphFocus also reruns on reveal and applies its overview/selection/semester focus.

Keep the existing implementation. Achieving parity would require extra lifecycle
or viewport restoration logic, which does not meet this experiment's simpler-code
criterion. The candidate remains available in branch history; the branch tip
restores the original production code and keeps the stronger parity tests.

No dependency or user-facing behavior change is retained, so no changelog entry is
needed. The full browser suite was not run; verification targets the changed tests.

## Final verification

After restoring production code, `bun run check`, `bun run build`, and all four
expanded switching cases passed again. Reviewed the complete final diff against
main with iris-deslop; retained only the parity tests and this experiment record.
