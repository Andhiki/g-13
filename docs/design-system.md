# AlignUI source notes

This project uses AlignUI's MIT licensed component source and design tokens. The source repository
is [AlignUI's Next.js TypeScript starter](https://github.com/alignui/alignui-nextjs-typescript-starter),
checked at commit `f37bd913a058ceca39d5bfc2369ec420018e5716`. The copyright and MIT terms are retained
in [docs/licenses/alignui.txt](licenses/alignui.txt).

AlignUI publishes components as source to copy into the app, not as a runtime component package.
Its components use Radix for behavior and Tailwind for their default styling. Use those upstream
component sources and defaults for standard controls. Do not rebuild them from raw Radix primitives
or restyle them through local variants or caller `className` values. Keep app data, callbacks, and
domain-specific logic in the app. `src/ui/select.tsx`, `src/ui/dropdown.tsx`, `src/ui/button.tsx`,
`src/ui/badge.tsx`, `src/ui/drawer.tsx`, `src/ui/modal.tsx`, `src/ui/kbd.tsx`, and
`src/ui/command-menu.tsx` use
AlignUI v1.2 source and variants for Select, Dropdown, Button, Badge, Drawer, Modal, Kbd, and
Command Menu. The existing
[`CompactButton`](../src/ui/compact-button.tsx) source is from the pinned AlignUI starter. The
license notice is retained in [docs/licenses/alignui.txt](licenses/alignui.txt). See the upstream
[Button](https://www.alignui.com/docs/v1.2/ui/button),
[Badge](https://www.alignui.com/docs/v1.2/ui/badge),
[Drawer](https://www.alignui.com/docs/v1.2/ui/drawer),
[Modal](https://www.alignui.com/docs/v1.2/ui/modal),
[Command Menu](https://www.alignui.com/docs/v1.2/ui/command-menu),
[Kbd](https://alignui.com/docs/v1.2/ui/kbd),
[Dropdown](https://www.alignui.com/docs/v1.2/ui/dropdown),
[Select](https://www.alignui.com/docs/v1.2/ui/select) documentation.

The token stylesheet `src/alignui.css` was generated from AlignUI CLI 0.0.19's blue/gray defaults.
Project surfaces and controls use these tokens. The React Flow canvas, semester lanes, course nodes,
and relationship edges use Tailwind utilities in their owning components and map definitions.

## Styling policy

Use AlignUI's upstream component source and default variants for interactive controls. Tailwind
utilities outside those components may arrange app layout and responsive behavior. Pass data and
callbacks into AlignUI components without overriding their default styles or behavior.

Use custom controls only where AlignUI has no matching component, such as the curriculum graph's
course nodes and relationship visualization. Keep their custom behavior domain-specific and document
the exception. Token declarations, font imports, and framework imports remain stylesheet setup.
Use Tailwind for app component styling. Keep global view-transition pseudo-elements, custom
theme-reveal keyframes, and the reduced-motion safety rule in `src/styles.css`; retain React Flow's
required vendor stylesheet. The Select viewport's inline `overflowY: undefined` is a Radix
compatibility override, not component appearance styling.
Tailwind Preflight and AlignUI provide standard control typography and focus styling. Link focus
styles are document-level Tailwind descendant variants, and graph buttons define their own
focus utilities.

Search uses AlignUI Command Menu, curriculum and interest filters use Select, and the theme toggle
uses Button. The app retains its course matching and routing behavior, and the search control
has no magnifying-glass icon. The same component policy applies to lists, details, and graph controls.

The Command Menu uses `cmdk` for its list keyboard behavior and Radix Dialog for modal behavior. The
app disables `cmdk`'s built-in fuzzy filtering so the existing course matcher and result order remain
unchanged. Its controlled trigger restores focus through Radix Dialog's close autofocus callback.
The search trigger shows the upstream AlignUI Kbd component with `/`. TanStack React Hotkeys
registers the shortcut while search is closed, ignores editable fields, and prevents the opening
keystroke from entering the query. The menu's existing autofocus and focus return remain in place.

Results use AlignUI Command Menu Group with its default inset padding. List separators divide
groups rather than individual course results. Each result places the title and muted code on
the first row, with semester guidance below the title.

## Curriculum graph styling

Course nodes, semester lanes, connections and canvas dots use Tailwind utilities with AlignUI
theme tokens for surfaces, text, selection, and relationship colors. Course variants are defined
with `tailwind-variants` in `MapNodes.tsx`. Data attributes identify courses, states, lanes, and the
map stage for behavior and tests without depending on styling classes. Motion controls course
position animation; React Flow owns calculated coordinates and SVG marker configuration.
Map zoom and fit buttons are omitted; users navigate through React Flow's
pan and zoom gestures. The relationship legend names prerequisite and dependent-course directions, while arrows retain
the academic prerequisite-to-dependent direction.

## Verification

See [Testing](testing.md) for the current Bun and browser suites. Historical migration tickets
and their temporary verification blockers were removed after implementation. Browser tests cover
both curricula on desktop and phones, including course clicks, relationships, search, list navigation,
and saved themes. The production build retains bundle-size and sourcemap warnings.

## Overlay control refinements

Search and the theme trigger use medium AlignUI Buttons with 40px heights and
10px corner radii. The theme trigger is a 40px square with 10px padding around
its 20px icon. The filter card uses the same corner radius, inset stroke token,
and resting shadow as these controls. These requested layout
and sizing refinements are exceptions to the default control styling policy above.

The top-center semester control is a group of buttons numbered 1–8. It uses the
existing scope filter and shows the selected semester; viewport-driven highlighting
is deferred. A single bottom-right "Switch View" button replaces the Peta/Daftar
pair. The React Flow minimap is removed. Below 1100px, search, theme, and an icon-only filter
trigger share one row, with an eight-column semester strip beneath. Semester buttons share the
available width instead of forcing fixed-width controls to overflow. The 40px filter trigger and
responsive semester padding are sizing exceptions to the default component policy.

Curriculum and interest filters move into the existing AlignUI drawer below 1100px. The drawer
slides up from the bottom and fits its two filters, with a maximum height of 85dvh. Only one copy
of those controls is mounted; their values stay in the curriculum explorer when switching layouts.
Below 650px, the command menu fills the viewport, with a visible cancel action and scrolling
results. The list reserves only the compact header's height.

Course cards use neutral AlignUI surfaces and typography, with plain 12px credit metadata beside
the course code and a 14px course title. Semester labels are provided by the enclosing lanes.
Their graph-specific button and connection handles remain custom, with uniform borders for selection
and relationship states instead of left accent bars. Handles extend outside the card without clipping.
Map details use a nonmodal AlignUI drawer on the left without an overlay so connections remain
visible and the canvas stays interactive. Course nodes explicitly enable pointer events because
React Flow disables them on nodes that are neither draggable nor selectable. List details use the same
nonmodal drawer, opening from the bottom below 650px and from the left on desktop.

## Semester tables

The Daftar view uses the Table primitives from the AlignUI v1.2
[Data Table source](https://alignui.com/docs/v1.2/ui/data-table), adapted in
`src/ui/table.tsx`. It does not require TanStack Table for static grouped rows.
Only the primitives needed by this view are included. Column headings use 12px
text to keep metadata smaller than the 14px course titles.

`CourseTable` uses four columns: code, course, credits, and category. Category and
code metadata use 12px text; semester headings use 16px text. Course titles open
the existing detail drawer. The title button's alignment and wrapping adapt to
its table cell. On small screens, code and category move below the title, and
SKS stays in its own column.

Required courses appear once under their first documented core semester.
Required courses without a semester remain in a separate unassigned section.
Electives appear once in their own section with their original semester labels.
Distinct source credit values remain visible rather than choosing one value.
The table area reserves desktop space for the filter card.

The Daftar view scrolls as a document rather than inside the course list. Overlay
controls stay fixed; the map keeps its viewport-sized canvas.

## Drawer motion

Theme changes use a light/dark toggle button and use the Sonic GIF mask
reveal from portfolio-magic through the View Transitions API. The 2000ms reveal
keeps the old page opaque beneath the new page; the button starts the transition.
The mask is preloaded and served locally from `public/theme/`. Reduced motion,
hidden documents, unsupported browsers, and selections with the same resolved
appearance switch immediately. System appearance changes remain automatic.

The course panel uses the local AlignUI Drawer adaptation. Both list and map
details use the same nonmodal drawer with 200ms slide-in and slide-out animations. On phones, details slide vertically from the bottom to match
their bottom-panel layout; desktop details slide from the left.

`CourseDetails` keeps the last selected content while its controlled Radix root
closes. Removing that root when selection clears skips Radix's exit animation.
Course selection and the URL still clear immediately; Radix handles removing the
panel after the animation. The existing reduced-motion rule suppresses movement.

## Roadmap controls

The full-screen quiz uses the existing AlignUI Button variants for its answers and
navigation. Answer cards contain only their label and expose `aria-pressed`. Their
quiz-specific sizing is at least 96px tall on phones and 128px on larger screens;
colors, focus, and selected states retain the AlignUI variants. The question enters
first, followed by staggered answers. Reduced motion skips the entrance sequence.
The quiz has no progress bar or extra page title.

The result uses the same full-screen React Flow canvas, Overlay, SemesterFilter,
expandable desktop filters, and mobile filter drawer as the curriculum page. Graduation
target and exposure semester use the existing AlignUI Select. Notes use AlignUI Drawer,
and clipboard fallback uses AlignUI Modal. There is no local toggle-group component.

The clipboard fallback is a native read-only input that selects its URL on focus.
It uses the app tokens and introduces no general-purpose input component.

The roadmap title is a text-only React Flow node above the semester lanes, so it pans
and zooms with the graph. The roadmap reuses the curriculum course nodes and its initial zoom. Semester
navigation and gestures move through the entire plan. Extra semesters remain available
in the semester control when work extends beyond the target.

The shared map overlay retains its navigation fade, and the pannable graph clips
course nodes at viewport edges. These existing map behaviors are intentional exceptions
to the visual inspector's gradient and page-margin rules.

## Typography

Use `Typography` from `src/ui/typography.tsx` for application text. Its `variant`
selects the shared style, while `as` selects the semantic HTML element and defaults
to `p`. Native attributes and refs pass through to that element.

Variants are `title`, `subtitle1`, `subtitle2`, `paragraph` (the default), `caption`,
`label`, and `labelSmall`. They use the existing AlignUI tokens. `graphTitle` and
`question` retain the responsive scale of the graph headings and roadmap quiz.
Keep layout and contextual colors in `className`. For Radix drawer and modal
titles and descriptions, use `asChild` with `Typography` to retain accessible names.
Interactive controls retain their existing AlignUI typography.
