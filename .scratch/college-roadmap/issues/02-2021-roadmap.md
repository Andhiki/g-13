# 02: Support the 2021 curriculum journey

**What to build:** Let a student choose curriculum 2021 and receive a roadmap built from the revision-2023 source, with recommendations from the correct laboratory group.

**Blocked by:** 01: Build the 2026 quiz-to-graph journey.

**Status:** completed

## Acceptance criteria

- [x] Curriculum 2021 works from the first quiz question through the graph and shared URL.
- [x] Offer Algoritma dan Komputasi, Sistem Cerdas, Rekayasa Perangkat Lunak dan Data, and Sistem Komputer dan Jaringan. Describe these as elective laboratory groups rather than imposing the 2026 wajib-minat model.
- [x] Explain that software and data share one laboratory group in this version.
- [x] Include all required courses, exactly one religion choice, and individual recommended elective courses in place of generic elective slots. Do not count the slots as additional courses.
- [x] Count repeated thesis and research-methodology placements once. Reconcile against the source's 104 required and 40 elective SKS, and expose any discrepancy instead of hiding it.
- [x] Use the 2021 prerequisite convention and source placement guidance. Do not apply 2026 course codes, internship tiers, or compulsory Kerja Praktik rules.
- [x] Switching curricula invalidates incompatible answers and replacements. Direct links cannot select a peminatan from the other version.
- [x] Add tests for the four groups, religion alternatives, slot replacement, deduplication, credit totals, and curriculum switching. Verify the 2021 quiz-to-result path on desktop and mobile.

## Verification

Implemented with planner and URL behavior tests plus desktop and mobile browser coverage. Source uncertainties remain visible in the result rather than becoming invented academic rules.
