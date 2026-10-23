# AlignUI source notes

This project uses AlignUI's MIT licensed component source and design tokens. The source repository
is [AlignUI's Next.js TypeScript starter](https://github.com/alignui/alignui-nextjs-typescript-starter),
checked at commit `f37bd913a058ceca39d5bfc2369ec420018e5716`. The copyright and MIT terms are retained
in [docs/licenses/alignui.txt](licenses/alignui.txt).

AlignUI publishes components as source to copy into the app, not as a runtime component package.
Its components use Radix for behavior and Tailwind for their default styling. Use those upstream
component sources and defaults for standard controls. Do not rebuild them from raw Radix primitives
or restyle them through local variants or caller `className` values. Keep app data, callbacks, and
domain-specific logic in the app. `src/ui/input.tsx`, `src/ui/select.tsx`, and `src/ui/dropdown.tsx`
use the documented AlignUI v1.2 default variants for Input, Select, and Dropdown. The existing
[`CompactButton`](../src/ui/compact-button.tsx) source is from the pinned AlignUI starter. The
license notice is retained in [docs/licenses/alignui.txt](licenses/alignui.txt). See the upstream
[Dropdown](https://www.alignui.com/docs/v1.2/ui/dropdown),
[Select](https://www.alignui.com/docs/v1.2/ui/select), and
[Input](https://www.alignui.com/docs/v1.2/ui/input) documentation.

The token stylesheet `src/alignui.css` was generated from AlignUI CLI 0.0.19's blue/gray defaults.
Project surfaces and controls use these tokens. The existing curriculum map layout and its data
visualization styles remain in place while tickets 03–05 migrate the remaining UI.

## Styling policy

Use AlignUI's upstream component source and default variants for interactive controls. Tailwind
utilities outside those components may arrange app layout and responsive behavior. Pass data and
callbacks into AlignUI components without overriding their default styles or behavior.

Use custom controls only where AlignUI has no matching component, such as the curriculum graph's
course nodes and relationship visualization. Keep their custom behavior domain-specific and document
the exception. Token declarations, font imports, and framework imports remain stylesheet setup.

Ticket 02 uses AlignUI Input for search, Select for curriculum and filters, and Dropdown for the
theme menu with an icon-only CompactButton trigger. Its inline course suggestion popup retains
app-specific matching and listbox behavior because AlignUI has no inline autocomplete component.
Tickets 03–05 apply the same policy to the list, detail panel, and graph controls.

## Ticket 02 previous implementation verification

The initial Tailwind implementation was verified on 23 October 2026 against the production build in Chromium at 1440px, 768px, and 390px.
Eighteen browser scenarios covered both curricula and themes, dropdown keyboard selection, Escape
dismissal and focus return, search selection and empty results, semester/group filters, saved theme
choices, and system theme changes. Additional checks covered browser history, keyboard search, and
saved theme application before hydration. No JavaScript or hydration errors occurred. These results
do not cover the current AlignUI Input and Select migration.

The project checks and production build passed for that implementation. Standards and spec reviews
cleared those changes.
The build retains bundle-size and upstream module-directive warnings.

The design inspector still flags the existing map's small text, contrast, clipped canvas content,
and long semester lanes. These belong to the graph migration in ticket 04. AlignUI's requested default
control shadows and brand mark are retained despite the inspector's generic style warnings.

The AlignUI source control update passes `bun run check` and `bun run build`. Browser review remains
pending because Chromium and the configured JetBrains runtime fallback are unavailable in this
environment.
