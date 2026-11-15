# Agent instructions

Be concise. Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution, verification, and changelog requirements. Use the relevant skill under `.agents/skills/`.

For substantial work, use only the stages needed: `gthirteen:grill-with-docs` for domain decisions, `gthirteen:to-spec` for behavior, `gthirteen:to-tickets` for implementation tickets, and `gthirteen:implement` for implementation.

For curriculum and exam archive work, use the corresponding `gthirteen` skill. Before domain exploration, read [docs/domain.md](docs/domain.md), `CONTEXT.md`, and relevant decisions in `docs/adr/`. Local issues follow [docs/issue-tracker.md](docs/issue-tracker.md) and [docs/triage-labels.md](docs/triage-labels.md).

For browser preview failures caused by missing Linux libraries, see [docs/browser-preview.md](docs/browser-preview.md).

## Lessons

- When form labels are self-explanatory, omit redundant helper copy and put lecturer context in the review dialog title.

- When reordering form fields, preserve existing explicit anonymity controls and submission semantics unless the user asks to change them.

- When grouping review rating rows, use spacing and consistent label/control alignment rather than a redundant heading that competes with field labels.

- When laying out dense review forms, place labels/help beside controls on desktop and display name first, with lecturer identity supplied by its detail page.

- When building reusable empty states, expose left, center, and right alignment and center the lecturer review empty state.

- When compacting a CTA, retain the requested FancyButton component and adjust its typography and size rather than replacing its visual style.

- When adjacent controls both select one value, use the same selection primitive so menu typography, caret motion, and hover behavior stay consistent.

- When building information-dense lecturer screens, use existing compact control variants and avoid forced large trigger or menu-item heights.

- When placing filter and sort controls together, match rendered font family, size, weight, and color instead of relying on each primitive's defaults.

- When using static imports in TanStack server handlers, keep server-only
  references inside handler bodies and keep request-dependent work out of module
  initialization.

- When a server-backed web feature grows, follow [docs/web-feature-structure.md](docs/web-feature-structure.md) and add only layers with real responsibilities.

- When writing environment examples, comment only non-obvious defaults and secret requirements, using short lines.

- When implementing review RPCs, validate untrusted input with Zod, keep SQL in repositories and business rules in services, and extract cryptographic identity hashing into a named function.

- When tightening lecturer detail layouts, reduce desktop padding and section gaps while preserving mobile spacing.

- When a lecturer detail name feels too dominant, use the subtitle1 style while keeping the semantic h1.

- When naming the review domain, use lecturer (dosen) throughout schema, APIs, routes, modules, and copy; professor denotes a rank rather than every lecturer.

- When aligning lecturer card headers, center the lecturer name, stars, and small action buttons in one row and inspect desktop and mobile screenshots before reporting completion.

- When course records support two languages, store both Indonesian and English names, display the selected language, and search both names regardless of locale.
- When labeling the alumni class tabs, use “All” or “Semua” for the unfiltered tab.

- When acting as a review sub-agent, report findings only; let the parent agent apply fixes.

- When redesigning alumni cards from references, retain the dense grid and a centered max-width page; use references for compact role and education lines rather than copying their layout.

- When writing user-facing copy, refer to the app rather than its internal name g-13.

- When changing frontend UI, take a screenshot and show it to the user.

- When designing the GitHub star toast, give the GitHub icon prominence and right-align actions with the primary button last.

- When placing course metadata and badges in a row, align them in a shared flex container and inspect the result.
