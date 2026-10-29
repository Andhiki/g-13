---
name: "gthirteen:modify-curriculum"
description: Use when changing courses, prerequisites, academic rules, or syllabi in an existing curriculum edition.
---

# Modify a curriculum edition

Read [`CONTEXT.md`](../../../../CONTEXT.md), the edition's source data and relevant audit records, and [`AGENTS.d/curriculum-import.md`](../../../../AGENTS.d/curriculum-import.md). Check `docs/adr/` for decisions that affect the change and inspect the official source for the affected edition.

1. Identify the exact curriculum edition, course or rule, and source pages. For corrections, record the current and corrected values before editing. If the source is ambiguous or unavailable, preserve the ambiguity and report it instead of inferring an academic rule.
2. Edit the authoritative source data and the edition's normalizer, syllabus, or rules as needed. Preserve provenance and source fields, stable course IDs, and the common curriculum contract. Add or update source-specific tests for the changed facts.
3. Update source data or structured audit evidence when provenance or unresolved interpretation changes. For curriculum or prerequisite corrections, add a `CHANGELOG.md` entry under `Unreleased` with the edition, course code, official source, page, and before/after values, as required by `CONTRIBUTING.md#changelog`.
4. Run `bun run check` and `bun run build`. Inspect curriculum exploration and roadmap behavior for the affected edition, including source warnings.

Done means each changed fact is supported by the edition's source, relevant tests and builds pass, and the affected curriculum and roadmap behavior have been inspected.
