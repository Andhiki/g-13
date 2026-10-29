---
name: "gthirteen:add-curriculum"
description: Use when adding a new official curriculum edition to the curriculum package.
---

# Add a curriculum edition

Read [`CONTEXT.md`](../../../../CONTEXT.md), relevant decisions in `docs/adr/`, and [`AGENTS.d/curriculum-import.md`](../../../../AGENTS.d/curriculum-import.md) before editing. Follow its ownership, output contract, academic rules, and add-edition steps.

1. Establish the official source, edition, page references, and provenance. Inspect the source directly; use temporary extraction tools if useful, but do not commit a reusable PDF extractor.
2. Add the edition's source data, syllabus records, explicit normalizer, typed slice, academic rules, and source-specific tests under `packages/curriculum/src/curricula/<id>/`.
3. Preserve source labels and raw values. Do not invent course codes, credits, or prerequisites; record ambiguity with source page references. Keep runtime data in the curriculum package and audit evidence in the documented output locations.
4. Register the edition in both the type and value in `packages/curriculum/src/registry-data.ts`. Change `defaultCurriculumId` in `registry.ts` only when the request calls for a new default.
5. Keep source provenance and unresolved interpretation with the edition's data or structured audit evidence. Add a sourced `CHANGELOG.md` entry under `Unreleased`. Run `bun run check` and `bun run build`; inspect curriculum exploration and roadmap behavior, including source warnings.

Done means the edition is registered, its source facts and rules are traceable, its tests and builds pass, and both curriculum exploration and roadmap behavior have been inspected.
