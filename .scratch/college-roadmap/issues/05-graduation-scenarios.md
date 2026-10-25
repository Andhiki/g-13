# 05: Compare 7- and 8-semester roadmaps

**What to build:** Let students switch graduation targets in the graph result and compare complete scenarios with specific conflicts and a recommendation when seven semesters do not fit.

**Blocked by:** 03: Plan optional Magang in both curricula; 04: Plan IUP international exposure.

**Status:** completed

## Acceptance criteria

- [x] Offer 7- and 8-semester controls in the result, not in the quiz. Update semester placements, activity milestones, prerequisite connections, and semester-credit totals together.
- [x] Keep every required course and selected elective visible exactly once in each scenario. Work that cannot fit remains visibly unresolved or beyond the selected target.
- [x] Use verified curriculum limits and explicit planning assumptions. Do not claim to know future grades, individual SKS entitlement, or actual future course offerings.
- [x] Detect known prerequisite-order conflicts, insufficient counted credits, work beyond the graduation target, and conflicting full-semester commitments. Preserve ambiguous source requirements as unresolved conditions.
- [x] Coordinate optional Magang and international internship as potentially the same activity. Do not duplicate the activity or award its credits twice. Keep combined recognition unresolved when approval is not established.
- [x] Explain what a blocked exposure semester means for UGM courses. Do not assume host credits replace specific required courses without equivalency evidence.
- [x] When seven semesters do not fit, show specific reasons and recommend inspecting the eight-semester alternative. If eight also has conflicts, show them instead of promising feasibility.
- [x] Preserve graduation target and exposure semester in the shared URL. Switching controls retains compatible quiz answers and elective selections.
- [x] Add scenario tests across both curricula, all exposure semesters, optional internship tiers, and both graduation targets. Verify at least one fitting and one conflicting scenario where the verified rules permit them.
- [x] Verify the complete individual-course graph, conflict messages, and result controls on desktop and mobile without changing existing curriculum-map behavior.

## Verification

Implemented with planner and URL behavior tests plus desktop and mobile browser coverage. Source uncertainties remain visible in the result rather than becoming invented academic rules.
