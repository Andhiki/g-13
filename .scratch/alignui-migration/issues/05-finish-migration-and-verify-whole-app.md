# 05: Finish migration and verify the whole app

**What to build:** Students use one consistent AlignUI design system across the entire curriculum explorer. Complete the remaining migration and verify complete journeys across peta kurikulum, search, list, and course details in both themes.

**Blocked by:** 02: Search and curriculum filters; 03: Course list and detail panel; 04: Curriculum map and relationship states.

**Status:** ready-for-agent

- [ ] Audit all visible app areas and states, migrate any remaining custom standard controls, and remove obsolete palette, typography, duplicate control styles, and migration-only compatibility styling.
- [ ] Use only AlignUI's free base components and shared tokens for standard UI. Custom curriculum elements follow the same tokens. Document any necessary deviations and adopted upstream sources.
- [ ] Verify complete journeys for kurikulum 2021 Revisi 2023 and 2026: search, filters, map/list switching, selection, detail reading, related-course navigation, and source attribution.
- [ ] Verify direct links with `kurikulum` and `mk`, browser history, theme persistence, and system preference without an override.
- [ ] Inspect desktop and 390px mobile layouts in light and dark themes. Confirm readable content, no unintended page overflow, keyboard access, visible focus, and usable mobile detail panels.
- [ ] Run the repository's complete checks and production build. Confirm no uncaught browser errors or hydration failures in the verified journeys, and record verification evidence and remaining limitations.
