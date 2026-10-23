# 02: Search and curriculum filters

**What to build:** Students search mata kuliah, choose a versi kurikulum, filter the results, and switch between peta kurikulum and list views using AlignUI's free controls in either theme. Existing filtering and navigation behavior remains intact.

**Blocked by:** 01: App shell and theme switching.

**Status:** ready-for-agent

- [ ] Migrate search, curriculum selection, semester and interest/group filters, and map/list switching using the shared AlignUI components and tokens.
- [ ] Preserve results for kurikulum 2021 Revisi 2023 and 2026, including current filter combinations, course selection, and empty-result behavior.
- [ ] Preserve the existing `kurikulum` and `mk` direct-link behavior and browser back/forward navigation. Do not add new URL semantics as part of this migration.
- [ ] Controls have accessible labels, visible focus, keyboard operation, and usable mobile sizing in light and dark themes.
- [ ] Verify representative searches, filter combinations, curriculum switching, and view switching at desktop and mobile widths in both themes. Run the existing checks and add behavior tests only where changed interaction logic needs coverage.
