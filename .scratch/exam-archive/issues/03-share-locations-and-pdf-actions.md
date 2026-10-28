# 03: Share folders and papers, and add PDF actions

**What to build:** Students can share a folder or paper, reopen the exact location, navigate with browser history, and download or open a paper from its AlignUI modal.

**Blocked by:** 01: Browse courses and preview an exam paper.

**Status:** completed

- [x] The URL identifies the current folder and selected paper using stable catalog identities; folder URLs reopen that location on a fresh visit.
- [x] A direct paper URL opens its modal with the correct course/year folder behind it. Closing leaves that folder visible.
- [x] Browser Back/Forward restores folder and modal state without loops or stale selections, including after a direct paper visit.
- [x] The modal offers Download, Copy link, Open in Drive, and Close using AlignUI, with accessible names and usable mobile controls.
- [x] Copy link copies the in-app paper URL and provides success/failure feedback; it does not copy the Google Drive URL.
- [x] Verify Download against a real Drive PDF and respect source permissions; provide an actionable Drive destination when Google prevents preview or downloading rather than promising an unavailable file.
- [x] Invalid or missing folder/paper URL values produce a usable archive state without crashing or opening an unrelated paper.
- [x] Keep URL interpretation at the route entry and Drive link behavior local to the archive module; reuse its folder/paper lookup interface rather than introducing duplicate state or traversal logic.
- [x] Preview loading remains limited to the selected paper while the modal is open, including history navigation.
- [x] Verify fresh folder/paper visits, closing a directly linked modal, Back/Forward, clipboard results, and actual Drive preview/download behavior. Run repository checks, build, and affected browser checks; add changelog coverage for sharing and actions.

## Comments

Use ticket 01's sample catalog for implementation and verification; full import coverage in ticket 02 is not a blocker.

Implemented URL-backed folder and file selection, in-app copy links with manual clipboard fallback, browser history restoration, and source downloads. A real PDF download returned an attachment filename and PDF bytes. Repository checks and production build pass; all 18 archive/sharing desktop/mobile browser checks pass, including direct visits, reloads, history, invalid locations, download actions, clipboard denial, and long course names on phones. The final clipboard-state refinement was rechecked on both browser projects.
