# 01: Floating map controls

**What to build:** Make the curriculum map a full-screen workspace with compact floating controls for search, light/dark mode, curriculum selection, zoom, and filters. Keep the interface nearly minimal, preserve existing interactions, and adapt controls for phone screens without obstructing the map.

**Blocked by:** None.

**Status:** completed

- [x] Replace the stacked header and filter rows with compact controls positioned at the map edges.
- [x] Keep search, theme, curriculum selection, zoom, and filter behavior intact.
- [x] Adapt the control layout for desktop, tablet, and phone widths, keeping group and semester filters available on phones.
- [x] Omit product identity treatment and source information.
- [x] Use restrained styling, sentence case, and avoid uppercase text combined with letter spacing.
- [x] Do not add automated tests for this UI-only change, per user request.

## Comments

Implemented in `src/styles.css`. `git diff --check` passed. Tests and browser checks were not run as requested. The build could not run in the implementation worktree because Vite was unavailable, so build/typecheck remain unverified.
