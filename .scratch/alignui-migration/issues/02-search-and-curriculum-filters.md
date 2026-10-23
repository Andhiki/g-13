# 02: Search and curriculum filters

**What to build:** Students search mata kuliah, choose a versi kurikulum, and filter the peta kurikulum using AlignUI's free controls in either theme. The navbar uses library dropdowns for curriculum and theme selection and omits the community label. Existing filtering and navigation behavior remains intact.

**Blocked by:** 01: App shell and theme switching.

**Status:** completed

- [x] Migrate search, curriculum selection, semester and interest/group filters using the shared AlignUI components and tokens.
- [x] Replace the navbar's browser-native curriculum selector with AlignUI's free dropdown component. Show the current versi kurikulum and preserve the existing curriculum-switching behavior.
- [x] Replace the navbar's separate theme buttons with an AlignUI dropdown offering light, dark, and system settings. Show the current setting and preserve system preference handling and the saved manual override.
- [x] Remove "Proyek komunitas mahasiswa" and its indicator from the navbar. This removes the navbar label only; the project's community standing remains unchanged.
- [x] Preserve results for kurikulum 2021 Revisi 2023 and 2026, including current filter combinations, course selection, and empty-result behavior.
- [x] Preserve the existing `kurikulum` and `mk` direct-link behavior and browser back/forward navigation. Do not add new URL semantics as part of this migration.
- [x] Controls have accessible labels, visible focus, keyboard operation, and usable mobile sizing in light and dark themes.
- [x] Verify representative searches, filter combinations, and curriculum switching at desktop and mobile widths in both themes. Verify both navbar dropdowns support keyboard opening, option selection, Escape dismissal, focus return, and a visible selected state. Confirm theme persistence after reload. Run the existing checks and add behavior tests only where changed interaction logic needs coverage.

## Comments

Completed on 23 October 2026 with a Luna implementation worker and separate standards/spec reviews. Public browser checks passed for both curricula and themes at desktop, tablet, and mobile widths. Project checks and the production build passed. See [verification and source notes](../../../docs/design-system.md). The user confirmed that the new list view and map/list switch belong to ticket 03.
