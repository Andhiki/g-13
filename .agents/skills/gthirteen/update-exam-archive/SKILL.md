---
name: "gthirteen:update-exam-archive"
description: Use when importing, scraping, reviewing, or editing Himakom UGM exam archive data.
---

# Update the exam archive

Read [`AGENTS.d/exam-archive-import.md`](../../../../AGENTS.d/exam-archive-import.md) before changing the catalog. It is the source of truth for the importer and catalog fields.

1. Treat `apps/web/src/features/exam-archive/catalog.ts` as a curated catalog. The importer is for the initial import, not recurring synchronization. For routine scrape requests, compare Himakom's course and Drive folder listings with the saved catalog, then apply reviewed additions or corrections directly while preserving human categorization and IDs.
2. For an initial import, run `bun apps/web/scripts/import-exam-archive.ts /tmp/exam-catalog.ts`. Review `/tmp/exam-catalog.ts.report.json` and the candidate before adopting anything. Unreadable folders or incomplete listings are failures; retain the existing snapshot and investigate them. Review uncertain years and UTS/UAS labels against the source.
3. Keep course IDs stable when names change. Use Drive file IDs for paper IDs, preserve MIME types, and keep `sourceFolderId` accurate. Leave unresolved exam labels as `null` and years as `Tanpa tahun` until reviewed.
4. When adopting a successful import, set `archiveUpdatedAt` in `apps/web/src/features/exam-archive/metadata.ts` to the report's `importedAt` ISO timestamp. For manual catalog edits, use the verification time as an ISO 8601 UTC timestamp. Leave it unchanged when an import fails or is discarded.
5. For user-visible catalog changes, update `CHANGELOG.md` under `Unreleased` following `AGENTS.md` and `CONTRIBUTING.md#changelog`. Run `bun run check` and `bun run build`, then inspect the production archive route.

Done means the catalog reflects reviewed source data, no failed import was adopted, the timestamp reflects the adopted update, and the required checks and route inspection are complete.
