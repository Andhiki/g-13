# 03: Course list and detail panel

**What to build:** Students browse mata kuliah in the list and open a course detail panel styled with AlignUI's free components. They can read the same academic information and source attribution on desktop and mobile in either theme.

The current app has no list view. Add the list view and an accessible map/list switch here, while preserving ticket 02's search and filter behavior across both views.

**Blocked by:** 01: App shell and theme switching.

**Status:** ready-for-agent

- [ ] Migrate course rows, category badges, detail panels, and their actions using the shared AlignUI components and tokens. Preserve the current layout and available content.
- [ ] Add an accessible switch between the existing peta kurikulum and the new course list. Keep search, curriculum, semester, and interest/group filters in effect when switching views.
- [ ] Preserve course names, codes, SKS, semester information, category labels, raw prerequisite text, matched prerequisite/dependent-course lists, and source locations wherever currently displayed.
- [ ] Preserve the meaning of wajib minat, versi kurikulum, and other glossary terms. Relationship displays do not imply personal enrollment eligibility.
- [ ] Preserve selection and direct-link behavior. Students can open, navigate, and close details with appropriate keyboard focus and accessible labels, including mobile overlays.
- [ ] Verify map/list switching, list-to-detail navigation, related-course navigation, source attribution, long prerequisite text, and mobile panel use for both curricula in both themes. Run the existing checks.
