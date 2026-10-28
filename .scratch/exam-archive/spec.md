# Arsip ujian

## Goal

Browse Himakom's exam archive inside the app with the feel of a file browser, and preview Google Drive PDFs without leaving it.

## Agreed behavior

- Add a separate “Arsip Ujian” page to navigation, shared across curriculum versions with no curriculum selector.
- Use AlignUI throughout. Prefer a simple list with folder/file icons and breadcrumbs, minimal labels, accessible single-click navigation, and usable keyboard and mobile interactions.
- Organize courses → years → UTS/UAS files. Preserve Himakom's course names and explicit year labels. Normalize source layouts that put UTS/UAS before years; use “Tanpa tahun” when no year is explicit rather than guessing.
- Include every source course, including empty folders. Empty folders open to an empty list.
- Sort courses alphabetically and years newest first. Search course names only.
- Open PDFs in an AlignUI modal with filename, Download, Copy link, Open in Drive, and Close. Verify actual Drive preview and download behavior rather than assuming public folder access guarantees file access. Provide Open in Drive when preview is unavailable.
- Folder locations and selected PDFs have shareable URLs. Direct PDF links restore the course/year behind the modal; closing leaves that folder visible. Browser Back/Forward restores location and modal state.
- Copy link shares the in-app PDF location, not the Drive URL.

## Catalog and ownership

- Source: https://himakom.ugm.ac.id/exam/ and its linked public Drive folders.
- A one-time scraper generates a TypeScript catalog checked with `satisfies`; humans review and maintain it afterward. There is no scheduled synchronization or visitor-time scraping.
- Drive hosts the files; do not copy PDFs into the app or repository.
- Preserve existing folder entries if an import retry cannot read that folder, and report failures. Distinguish confirmed empty folders from unreadable folders; do not fabricate empty data after a failed request.
- Preserve source provenance and stable file identities so manual edits and catalog expansion do not invalidate links unnecessarily.
- All 297 discovered public folders were read during the initial import. The catalog contains 102 course entries and 1,613 file entries. A real Basis Data PDF preview and download were verified. Individual file permissions remain controlled by Drive.

## Module design

Keep the archive in the existing web feature structure, separate from curriculum data. Its module owns the catalog contract, course filtering, folder resolution, and paper lookup behind a small interface. Routing and AlignUI consume that interface; they should not know source scraping conventions or duplicate traversal logic.

The scraper's output is the seam between the one-time import and the human-maintained catalog. Accept fetched input in normalization logic and return validated results and diagnostics so source errors can be tested without live Google requests. Keep network and file writes explicit. Do not introduce a provider framework, repository abstraction, new package, or speculative adapters.

Keep Drive-specific preview/download/share behavior local to the archive module. Validate URL inputs at routing entry and scraped data at import entry. Test observable results through the same interface callers use.

## Performance and verification

- Browse/search saved metadata without live Drive requests. Mount a PDF preview only for the selected paper while its modal is open, and release it on close.
- Keep the archive catalog out of unrelated curriculum/roadmap initial loads using existing route-loading conventions.
- Verify real folder navigation, empty folders, course-only search, accessible modal behavior, direct links, and Back/Forward.
- Cover normalization, unknown years, duplicate or ambiguous source entries, failed import preservation, and malformed locations with focused behavior checks.
- Run repository checks, build, and relevant browser checks for implementation. Add user-facing changelog coverage as tickets land without repeating the same change.

## Delivery

Three approved vertical slices: sample browsing and preview; full archive import; sharing and PDF actions. Tickets 2 and 3 depend on ticket 1, but do not gate one another.
