# AlignUI source notes

This project uses AlignUI's MIT licensed component source and design tokens. The source repository
is [AlignUI's Next.js TypeScript starter](https://github.com/alignui/alignui-nextjs-typescript-starter),
checked at commit `f37bd913a058ceca39d5bfc2369ec420018e5716`. The copyright and MIT terms are retained
in [docs/licenses/alignui.txt](licenses/alignui.txt).

`src/ui/compact-button.tsx` adapts the AlignUI CompactButton styling to Tailwind Variants. Its
source is `components/ui/compact-button.tsx` in the upstream starter. `src/ui/dropdown-menu.tsx`
adapts the upstream `components/ui/dropdown.tsx` content, item, and radio item patterns to local CSS
and Radix primitives. The app uses the free Dropdown source pattern for curriculum, theme, and
interest group selection. The app intentionally uses plain text labels with a selection mark in place
of the starter's icon-heavy general-purpose menu options.

The token stylesheet `src/alignui.css` was generated from AlignUI CLI 0.0.19's blue/gray defaults.
Project surfaces and controls use these tokens. The existing curriculum map layout and its data
visualization styles remain in place while the shell, dropdown, search, and filter controls migrate.

## Ticket 02 verification

Verified on 23 October 2026 against the production build in Chromium at 1440px, 768px, and 390px.
Eighteen browser scenarios covered both curricula and themes, dropdown keyboard selection, Escape
dismissal and focus return, search selection and empty results, semester/group filters, saved theme
choices, and system theme changes. Additional checks covered browser history, keyboard search, and
saved theme application before hydration. No JavaScript or hydration errors occurred.

The project checks and production build passed. Standards and spec reviews cleared the final changes.
The build retains bundle-size and upstream module-directive warnings.

The design inspector still flags the existing map's small text, contrast, clipped canvas content,
and long semester lanes. These belong to the graph migration in ticket 04. AlignUI's requested default
control shadows and brand mark are retained despite the inspector's generic style warnings.
