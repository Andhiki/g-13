# 02: Normalize the 2026 curriculum source

**What to build:** Students can explore the 2026 curriculum through the same shared curriculum model as the 2021 version, with the source's course and placement distinctions intact.

**Blocked by:** 01: Normalize the 2021 Revisi 2023 source.

**Status:** completed

- [x] Keep 2026 source-specific interpretation in its own adapter and feed the shared curriculum model.
- [x] Preserve course identity, placement and semester guidance, SKS, raw prerequisite text, source references, and reading notes.
- [x] Preserve the distinction between Wajib Minat (WM), which is required within a chosen interest, and free elective courses.
- [x] Keep the existing 2026 search, group and semester filters, map relationships, and course details working, without changing 2021 behavior.
- [x] Add coverage for representative 2026 source records, including WM and free elective placements.

## Comments

Implemented as a dedicated 2026 source adapter. Targeted adapter tests, full test suite, and typecheck pass.
