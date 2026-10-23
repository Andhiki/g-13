# 04: Curriculum map and relationship states

**What to build:** Students explore the existing peta kurikulum with course nodes, prerequisite connections, and map controls that follow AlignUI's default visual foundation. Selecting a course clearly distinguishes it from its prerequisites and courses that depend on it in both themes.

**Blocked by:** 01: App shell and theme switching.

**Status:** ready-for-agent

- [ ] Apply shared theme tokens to custom course nodes, semester lanes, connections, canvas, minimap, and map controls. Keep the existing graph layout and academic relationship derivation.
- [ ] Use AlignUI's primary color for the selected course and separate theme colors for prerequisite and dependent-course directions. Keep arrow direction and provide text labels or a legend so color is not the only distinction.
- [ ] Preserve existing pan, zoom, course selection, related-course highlighting, and detail-opening behavior.
- [ ] Keep course text, selected and related states, connections, and controls readable in light and dark themes. Present relationship states as academic relationships, not personal enrollment eligibility.
- [ ] Verify a course with incoming and outgoing relationships, a course without matched relationships, curriculum switching, theme switching while a course is selected, and desktop/mobile map use. Run the existing checks.
