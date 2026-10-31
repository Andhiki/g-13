# Arsip ujian: import and maintenance

The catalog contains metadata from [Himakom's exam archive](https://himakom.ugm.ac.id/exam/)
and its linked public Google Drive folders. Files stay on Drive. Browsing uses the saved
TypeScript catalog and never lists Drive folders at runtime.

## Initial import

From the repository root:

```sh
bun apps/web/scripts/import-exam-archive.ts /tmp/exam-catalog.ts
```

This is a one-time import tool, not a recurring synchronization command. It requires
public source access, uses four concurrent requests with timeouts, and writes a candidate
plus `/tmp/exam-catalog.ts.report.json`. It refuses to write directly to the live catalog.

Review the report before copying the candidate into the archive's `catalog.ts`:

- Unreadable folders and unrecognized/paginated listing formats are failures, not empty
  folders. A failed descendant preserves the entire previous course snapshot. If a new
  unreadable course has no snapshot, no candidate catalog is written. The existing catalog
  stays untouched. Fatal source-page failures also stop before writing a candidate.
- Course names and explicit year labels are retained. Shared Drive folders can appear
  under distinct source course names; their catalog course IDs remain distinct.
- Years come from the nearest explicit year folder, or a single explicit filename year.
  Conflicts are reported; folder labels take precedence. Unknown or ambiguous filename
  years go under “Tanpa tahun”. Embedded timestamps are not treated as exam years.
- Filename UTS/UAS labels take precedence over source folder labels. Missing labels stay
  unknown; conflicts appear in the report. Review the paper itself before correcting them.
- PDFs, JPEGs, and Word documents are kept with their MIME types. The Drive viewer handles
  previews; access and format support remain subject to Drive.
- Creation timestamps are retained from Drive listings for files and explicit year folders.
  Course roots and filename-derived years without source folder dates keep a null timestamp.
- Repeated paper IDs are deduplicated within each destination year folder. Confirmed empty
  courses and year folders remain present. An empty source subfolder without a year maps
  to an empty “Tanpa tahun” folder.

After adopting the candidate, run formatting, repository checks, and a production build,
then inspect the archive in the browser. The catalog's `satisfies ExamCourse[]` checks
manual edits, while
the explicit array annotation prevents the full dataset from expanding inferred types
throughout callers. The production route keeps this catalog out of unrelated page loads.

## Human maintenance

After the initial import, edit the TypeScript catalog directly. Add or remove courses,
years, or files as needed. Keep an existing course's `id` when renaming it, and use the
Drive file ID as each paper's `id`. Keep `sourceFolderId` and MIME types accurate. Leave
an unknown exam label as `null` and an unknown year as “Tanpa tahun” until reviewed.

Do not rerun the importer over a curated catalog: source normalization cannot preserve
human categorization choices. If retrying an incomplete initial import, compare its
candidate with the previous catalog and manually review the differences before adopting.

The [saved import report](../output/data/exam-archive-import.json) records source coverage and unresolved metadata for human review;
it is not downloaded by the application. No PDF binaries, credentials, or Drive API keys
are required or stored.
