# 01: App shell and theme switching

**What to build:** Students see the existing app shell styled with AlignUI's free base components and default visual foundation. They can use either light or dark mode, initially following their system preference, with a saved manual override. This establishes the shared components and tokens used by subsequent migration tickets.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] Use AlignUI's free base component source and default tokens, typography, and control styling. Reference https://alignui.com/docs/v1.2/introduction and its linked installation and foundation documentation. Record the upstream version and retain required license notices with adopted code.
- [x] Replace the shell's green/cream palette and Figtree with AlignUI defaults. Preserve the current layout, Indonesian copy, community standing, and curriculum behavior.
- [x] Provide a keyboard-accessible theme toggle. Follow system preference until the student chooses an override, persist that choice, and restore it on reload without hydration errors or an initial flash of the wrong theme.
- [x] Both themes work on initial load and direct links. Shared theme tokens are available to controls and custom curriculum elements migrated by later tickets.
- [x] Existing areas remain usable while migration proceeds. Keep remaining legacy styling scoped so each ticket can land independently.
- [x] Verify the shell at desktop and mobile widths, keyboard focus, system preference, override persistence, and server-rendered initial loading. Run the repository's existing checks.

## Comments

Shell foundations were delivered in `f84db38`. Ticket 02 completed browser verification and corrected saved-theme hydration while replacing the initial theme buttons with a dropdown. Source provenance is recorded in [AlignUI source notes](../../../docs/design-system.md).
