# Agent instructions

Be concise. Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution, verification, and changelog requirements. Use the relevant skill under `.agents/skills/`.

For substantial work, use only the stages needed: `gthirteen:grill-with-docs` for domain decisions, `gthirteen:to-spec` for behavior, `gthirteen:to-tickets` for implementation tickets, and `gthirteen:implement` for implementation.

For curriculum and exam archive work, use the corresponding `gthirteen` skill. Before domain exploration, read [docs/domain.md](docs/domain.md), `CONTEXT.md`, and relevant decisions in `docs/adr/`. Local issues follow [docs/issue-tracker.md](docs/issue-tracker.md) and [docs/triage-labels.md](docs/triage-labels.md).

For browser preview failures caused by missing Linux libraries, see [docs/browser-preview.md](docs/browser-preview.md).

Before using ui-sdk, follow the `ui-sdk` skill in `.agents/skills/ui-sdk/` and read `apps/web/node_modules/@ui-sdk/react/docs/llms.txt`. To build a new component, also search `apps/web/node_modules/@ui-sdk/react/docs/core.md` by heading, and read `rendering.md` next to it.
