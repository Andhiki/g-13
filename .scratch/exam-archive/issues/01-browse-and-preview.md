# 01: Browse courses and preview an exam paper

**What to build:** Students can enter “Arsip Ujian” from navigation, browse a small real sample through course and year folders, and open a Google Drive PDF inside the app using AlignUI. The archive feels like a file browser and is independent of curriculum selection.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] Add a separate archive page to navigation without a curriculum selector.
- [x] Use a real, small TypeScript catalog checked with `satisfies`, retaining source names, year labels, and provenance; Drive continues hosting the files.
- [x] Use AlignUI for single-click list browsing with folder/file icons, breadcrumbs, accessible keyboard interactions, and mobile usability; avoid redundant labels.
- [x] Browse course → year → UTS/UAS files, with alphabetic courses and newest-first years. Preserve empty folders and show an empty list when opened.
- [x] Search filters course names only, including when filenames contain the same query.
- [x] Selecting a paper opens an accessible modal with filename and a real Drive PDF preview; closing releases the preview. Verify a real paper, and provide Open in Drive for unavailable previews.
- [x] Browsing uses saved metadata without live Drive requests, and unrelated pages do not eagerly load the catalog or viewer.
- [x] Keep catalog filtering, folder resolution, and paper lookup behind a small archive module interface, separate from curriculum data; routing and UI do not duplicate traversal logic.
- [x] Verify browsing, empty folders, course-only search, keyboard/modal interactions, and lazy preview loading through observable behavior. Run repository checks, build, and affected browser checks; update the user-facing changelog.

## Comments

Scope and design decisions are captured in the feature spec. Full source coverage belongs to ticket 02; shareable locations and additional PDF actions belong to ticket 03.

Implemented at `/exam` with two real courses and five PDFs. Verified a live Basis Data PDF rendering inside the modal. Repository checks and production build pass; all six archive browser checks pass across desktop/mobile, and the 18 affected curriculum/list browser checks passed. Empty courses and years are covered through the archive interface with fixtures. Full import and share/download actions remain in tickets 02 and 03.
