# 02: Import the complete Himakom archive

**What to build:** Students can browse all courses and available papers linked by Himakom, including empty folders. A one-time import produces the typed catalog, and humans can correct and maintain it afterward without ongoing synchronization.

**Blocked by:** 01: Browse courses and preview an exam paper.

**Status:** completed

- [x] Read the course links from https://himakom.ugm.ac.id/exam/ and traverse their public Drive folders, reporting inaccessible entries and incomplete traversal explicitly.
- [x] Generate the TypeScript catalog consumed by the existing archive module, checked with `satisfies`; validate fetched data before writing it, and preserve source provenance and stable file identities.
- [x] Retain every source course, including confirmed empty folders, and preserve course names and explicit year labels.
- [x] Normalize source nesting into course → year → UTS/UAS files, deriving years only from explicit source folders or filenames. Use “Tanpa tahun” when the year is unknown and report ambiguous entries for human review.
- [x] Handle repeated source links without losing distinct course names or listing the same paper twice within the same destination folder.
- [x] On partial retries, preserve previous catalog entries for unreadable folders and report failures; never replace unreadable content with an empty listing or silently overwrite the catalog after a fatal failure.
- [x] Keep PDF binaries hosted on Drive; browsing the imported catalog performs no live scraping or folder-listing requests.
- [x] Document initial execution, import diagnostics, human review, and subsequent manual catalog edits. Explicitly state that the scraper is for the initial pass, not a recurring update process.
- [x] Keep source normalization testable with supplied fetched input and returned results/diagnostics, separate from network requests and catalog writes; avoid a provider framework or speculative adapters.
- [x] Verify normalization, unknown years, duplicates, empty versus unreadable folders, and failed-import preservation with focused checks. Inspect the resulting catalog in the archive, run affected repository/browser checks, and extend changelog coverage without duplicating ticket 01.

## Comments

Imported 102 source course entries from 297 publicly readable folders, with 1,613 file entries (957 PDFs, 611 JPEGs, 45 Word documents). The saved report contains 73 metadata diagnostics; 56 files remain under “Tanpa tahun” for human review. No folder fetch failed. Repository checks, production build, and all six desktop/mobile archive browser checks pass. Import tests cover malformed/paginated listings, normalization, aliases, duplicates, empty folders, and preservation after failures.
