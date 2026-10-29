# Importing or removing a curriculum

PDF layouts change between editions. Inspect the new official document and produce
reviewable JSON; there is deliberately no permanent PDF migration or extraction
script. Temporary extraction tools may help with one document, but do not commit
them as a reusable importer. The contracts below describe the output, not a PDF
parser. Retained PDFs live in `output/sources/`; page manifests and audit data
live in `output/data/`. Keep source facts and unresolved ambiguity with the
edition's structured data rather than separate history documents.

## Ownership

- `packages/curriculum/src/curricula/<id>/source.json`: the slice's source tables
  and provenance. Keep exactly one runtime copy.
- `packages/curriculum/src/curricula/<id>/syllabi.json`: syllabus records keyed by
  course code without hyphens.
- `normalize.ts`: converts that edition's source shape to the common `Curriculum`
  contract. Its input may be inferred from its local JSON; its return type must be
  explicit. Do not make a new edition imitate an old PDF's table structure.
- `index.ts`: exports a value explicitly typed as `CurriculumSlice`, containing
  `curriculum`, `syllabi`, and `rules`.
- Tests beside the JSON: source-specific facts, anomalies, and provenance checks.
- `output/sources/`: original PDFs and source snapshots.
- `output/data/`: page manifests, visual transcriptions, and independent audit
  reports. These are evidence, not a second runtime dataset.

## Common output contract

The authoritative types are [model.ts](../packages/curriculum/src/contracts/model.ts)
and [rules.ts](../packages/curriculum/src/contracts/rules.ts). A normalizer returns
this shape (the example is schematic, not an academic source):

```json
{
  "id": "<registered curriculum id>",
  "edition": "Official edition label",
  "all": [
    {
      "id": "COURSE001",
      "code": "COURSE001",
      "title": "Indonesian source title",
      "englishTitle": "English source title",
      "placements": [
        {
          "section": "core",
          "label": "Wajib",
          "group": "",
          "semester": 1,
          "semesterLabel": "1",
          "credits": 3,
          "prerequisiteRaw": "-",
          "printedPage": 10,
          "pdfPage": 25
        }
      ]
    }
  ],
  "core": ["<same course records whose placements include core>"],
  "electives": ["<same course records with elective or interest placements>"],
  "groups": [{ "name": "Source group name", "count": 1 }],
  "requiredCredits": 0,
  "totalCredits": 0,
  "summary": "Source and edition summary",
  "sourceTitle": "Official document title",
  "sourceUrl": null,
  "readingNotes": ["Unresolved source ambiguity with page references"]
}
```

`core` and `electives` contain objects, not IDs or the explanatory strings above.
Credit totals come from the official source, never from this example. Section is
`core`, `interest`, or `elective`; missing semester, credits, or page references are
`null`. Keep raw labels as well as normalized values. A course has one stable ID
within its curriculum, with repeated semesters/groups represented as placements.
Do not silently merge distinct courses with conflicting reused codes. Preserve
placeholders and ambiguity explicitly; do not invent course codes or prerequisites.

### Existing source shapes

Existing slices retain their historical extraction formats. The 2021 normalizer
reads `required_schedule.courses`, `elective_catalog.courses`, `sources`, and
`credit_summary`. Rows include `code_raw`, `code_complete`, `name_id`, `name_en`,
`sks`, `prerequisite_raw`, and `source_refs`; required rows also carry `semester`,
`record_kind`, `choice_group`, and `wp_raw`, while elective rows carry
`semester_labels`, `semester_labels_raw`, and `group_context`.

The 2026 normalizer reads `course_schedule.required_program_rows`,
`course_schedule.interest_area_rows`, and
`course_schedule.outside_program_activity_elective_rows`, plus
`curriculum_summary`. Rows carry `course_code_raw`, `course_title_id_raw`,
`course_title_en_raw`, `semester_guidance_raw`, `credits_total`, `prerequisite_raw`,
and `source_page`. Interest rows also carry `course_type_raw` and
`interest_area_raw`. Preserve the extra provenance and source fields already in
these JSON files, even when the app does not read them.

## Syllabus JSON

```json
{
  "COURSE001": {
    "title": "Source heading",
    "description": "Source description, or an empty string when absent",
    "syllabus": "Source topic text",
    "references": ["Source reference text"],
    "printedPage": 10,
    "pdfPage": 25,
    "alternatives": []
  }
}
```

`alternatives` is optional. Repeated codes with matching titles retain separate
versions and page references; the first source occurrence is the primary record,
not a claim of authority. Conflicting titles under the same code remain unresolved
and are excluded from code-based lookup until reviewed. Never alias codes by title
alone. Preserve parenthesized headings, short course codes, reference labels with
or without colons, and the boundary between syllabus text and references. Strip
page headers/footers without dropping real topics. PDF page numbers are physical,
1-based pages; printed page offsets must be checked for that document rather than
copied from an older edition.

## Academic rules

Populate every field in `AcademicRules` from supported source evidence, including:
interest grouping and exemptions, elective recommendations, internship choices
and recognized course IDs, graduation/proposal placement, practical work,
community-service constraints, and starred-prerequisite semantics. Unsupported
recognition stays explicit in `readingNotes`. Keep source pages in the structured
records and test every special rule. Future rules may require extending the common
contract and planning algorithm; never silently treat a new edition as 2026.

The web app owns scheduling algorithms, quiz presentation, and map rendering.
Data access remains synchronous and works in browsers and servers. Public API:
`listCurricula`, `getCurriculum`, `getCourse`, `getSyllabus`, `getAcademicRules`,
and `getRelations`. Validate external IDs with `isCurriculumId`; course IDs are
strings and absent course/syllabus lookups return `undefined`.

## Add an edition

1. Read `CONTEXT.md` and relevant ADRs. Inspect the official PDF and record its
   URL or local source path, SHA-256, edition, and page ranges in source data.
2. Create the slice and its JSON, normalizer, academic rules, and source tests.
   Check totals independently, unique IDs, repeated placements, ambiguous codes,
   and syllabus coverage. A syllabus count is not course-table coverage.
3. Register the slice in `packages/curriculum/src/registry-data.ts` (both the
   explicit registry type and value). `registry.ts` derives `CurriculumId` from
   those keys. Change `defaultCurriculumId` there only when deliberately selecting
   the default edition.
4. Keep all web imports at `@g13/curriculum`. Do not add source aliases, TypeScript
   paths into package source, development source exports, or declaration maps.
5. Run `bun run check` and `bun run build`. Inspect both curriculum exploration
   and roadmap results, including source warnings.
6. Keep provenance and unresolved ambiguity in source data or structured audit
   evidence. Add a sourced `CHANGELOG.md` entry for new editions or academic
   corrections. Do not ship temporary extraction scripts.

## Remove an edition

Remove its registry type/value entries and delete its slice. If it was the default,
choose another registered edition. Delete or update edition-specific app fixtures
and any visual calibration for that edition. Keep retained source PDFs and audit
evidence unless removal is explicitly requested. Registry-driven selectors
stop offering the removed edition; invalid explorer URLs fall back to the default,
and invalid roadmap URLs resume curriculum selection. No compatibility alias is
kept. Run the same checks as for an addition.

## Build boundary

Run commands from the repository root. `bun run build:packages` builds packages
separately; run it before starting development and after changing package source.
`bun run dev` only starts app development servers and does not build or watch packages.
Production builds use the same tsdown output. Both
JavaScript and TypeScript exports resolve to `dist`; generated artifacts are
ignored by Git. Declaration generation uses isolated declarations with Oxc because
the installed TypeScript 7 compiler does not provide the classic compiler API.

See the official [Turbo task configuration](https://turborepo.dev/docs/reference/configuration) and
[tsdown declaration documentation](https://tsdown.dev/options/dts).

The package build's `precompute-curricula` plugin normalizes runtime curriculum
data, so browsers download neither raw audit JSON nor the adapters.
`getSyllabus` returns `Promise<Syllabus | undefined>` and loads syllabus data
separately for each curriculum. Callers must handle download failures.
