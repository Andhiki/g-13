# 02: Search and curriculum filters

**What to build:** Students search mata kuliah, choose a versi kurikulum, and filter the peta kurikulum using AlignUI's source components with their upstream default variants in either theme. Wire the app's data and callbacks into those components; do not rebuild their behavior or override their styling. The navbar uses AlignUI Select for curriculum and an icon-triggered AlignUI Dropdown for theme selection, and omits the community label. Existing filtering and navigation behavior remains intact.

**Blocked by:** 01: App shell and theme switching.

**Status:** ready-for-human

- [x] Use AlignUI Input for search, AlignUI Select for curriculum and filters, AlignUI Dropdown with an icon-only CompactButton trigger for light, dark, and system theme choices, and AlignUI CompactButton for the clear-search action. Keep the inline course suggestion list as an app-specific exception because AlignUI has no inline autocomplete component.
- [x] Use AlignUI's documented source and default variants without local control styles or caller `className` overrides. Record the upstream source/version and license notice. Add custom interaction logic only where AlignUI has no matching component, and document that exception.
- [x] Show selected curriculum, group, theme, and semester state. Preserve curriculum switching, system theme handling, saved manual override, search, selection, and empty-result behavior.
- [x] Remove "Proyek komunitas mahasiswa" and its indicator from the navbar. This removes the navbar label only; the project's community standing remains unchanged.
- [x] Preserve results for kurikulum 2021 Revisi 2023 and 2026, including current filter combinations, course selection, and empty-result behavior.
- [x] Preserve the existing `kurikulum` and `mk` direct-link behavior and browser back/forward navigation. Do not add new URL semantics as part of this migration.
- [ ] Confirm controls have accessible labels, visible focus, keyboard operation, and usable mobile sizing in light and dark themes.
- [ ] Verify representative searches, filter combinations, and curriculum switching at desktop and mobile widths in both themes. Verify the Select and Dropdown controls support keyboard opening, option selection, dismissal, focus return, and a visible selected state. Confirm theme persistence after reload. Run the existing checks and add behavior tests only where changed interaction logic needs coverage.

## Comments

Reopened after the user clarified that standard controls must use AlignUI source components and upstream defaults, without local component styling. The prior Tailwind migration did not satisfy this requirement.

- [x] Replace the local Radix/Tailwind Variants dropdown wrapper and custom search/semester controls with the AlignUI source components described above.
- [ ] Verify unchanged filtering and navigation behavior, keyboard access, theme persistence, and mobile use in both themes.

The AlignUI source controls are implemented. `bun run check` and `bun run build` pass. Browser verification remains pending and needs a host with Chromium; this environment has neither Chromium nor the configured JetBrains RemoteDev runtime. The ticket is ready for human browser verification.

Historical record for the initial Tailwind implementation, before the AlignUI source requirement reopened this ticket: completed on 23 October 2026 with a Luna implementation worker and separate standards/spec reviews. Public browser checks passed for both curricula and themes at desktop, tablet, and mobile widths. The user confirmed that the new list view and map/list switch belong to ticket 03. See [source and verification notes](../../../docs/design-system.md).
