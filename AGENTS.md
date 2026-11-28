# Agent instructions

Be concise. Write every GitHub issue, pull request, comment, review, and commit message in English, even when the conversation, the code, or existing text is in Indonesian. User-facing app copy and its Indonesian translations are product content and stay as they are.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution, verification, and release notes requirements. Use the relevant skill under `.agents/skills/`.

For substantial work, use only the stages needed from the curated `gthirteen` skillset: `gthirteen:grill-with-docs` for domain decisions, `gthirteen:to-spec` for behavior, `gthirteen:to-tickets` for implementation tickets, and `gthirteen:implement` for implementation. GitHub Issues are the skillset's spec and progress tracking. For every task, read the relevant issues first — spec, tickets, blockers, and their labels per [docs/triage-labels.md](docs/triage-labels.md), following [docs/issue-tracker.md](docs/issue-tracker.md) — and keep them updated: post progress comments as work advances and close a ticket once its acceptance criteria are met.

Every PR that completes a GitHub issue must include `Closes #123` or
`Resolves #123` in the PR description, one line per completed issue. Use
`Refs #123` for partial or related work. Follow the
[issue tracker merge rules](docs/issue-tracker.md#pull-requests).

For curriculum and exam archive work, use the corresponding `gthirteen` skill. Before domain exploration, read [docs/domain.md](docs/domain.md), `CONTEXT.md`, and relevant decisions in `docs/adr/`.

For browser preview failures caused by missing Linux libraries, see [docs/browser-preview.md](docs/browser-preview.md).

When building UI, reuse components from `@/ui` where they fit. When creating a shared component, check the UI SDK for a suitable primitive before building one from scratch.

Before using ui-sdk, follow the `ui-sdk` skill in `.agents/skills/ui-sdk/` and read `apps/web/node_modules/@ui-sdk/react/docs/llms.txt`. To build a new component, also search `apps/web/node_modules/@ui-sdk/react/docs/core.md` by heading, and read `rendering.md` next to it.
