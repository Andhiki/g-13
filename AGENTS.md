# Agent instructions

Be concise. Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution, verification, and changelog requirements. Use the relevant skill under `.agents/skills/`.

For substantial work, use only the stages needed: `gthirteen:grill-with-docs` for domain decisions, `gthirteen:to-spec` for behavior, `gthirteen:to-tickets` for implementation tickets, and `gthirteen:implement` for implementation.

For curriculum and exam archive work, use the corresponding `gthirteen` skill. Before domain exploration, read [docs/domain.md](docs/domain.md), `CONTEXT.md`, and relevant decisions in `docs/adr/`. Local issues follow [docs/issue-tracker.md](docs/issue-tracker.md) and [docs/triage-labels.md](docs/triage-labels.md).

For browser preview failures caused by missing Linux libraries, see [docs/browser-preview.md](docs/browser-preview.md).

## Lessons

- When course records support two languages, store both Indonesian and English names, display the selected language, and search both names regardless of locale.
- When acting as a review sub-agent, report findings only; let the parent agent apply fixes.

- When redesigning alumni cards from references, retain the dense grid and a centered max-width page; use references for compact role and education lines rather than copying their layout.

- When writing user-facing copy, refer to the app rather than its internal name g-13.

- When changing frontend UI, take a screenshot and show it to the user.

- When designing the GitHub star toast, give the GitHub icon prominence and right-align actions with the primary button last.

- When placing course metadata and badges in a row, align them in a shared flex container and inspect the result.
