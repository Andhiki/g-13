# Agent and contributor workflow

Read [`CONTRIBUTING.md`](../CONTRIBUTING.md) for public contribution rules, verification, changelog, and third-party material requirements. The root [`AGENTS.md`](../AGENTS.md) is a short entry point; use this guide and the focused skill for the work at hand.

## Agentic engineering

Use only the stages the task needs. Small, well-specified changes can go straight to implementation.

1. [`gthirteen:grill-with-docs`](../.agents/skills/gthirteen/grill-with-docs/SKILL.md) resolves unclear domain language and decisions against `CONTEXT.md`, the code, and relevant ADRs.
2. [`gthirteen:to-spec`](../.agents/skills/gthirteen/to-spec/SKILL.md) records agreed behavior and implementation boundaries in `.scratch/<feature>/spec.md`.
3. [`gthirteen:to-tickets`](../.agents/skills/gthirteen/to-tickets/SKILL.md) breaks an approved spec into local, dependency-ordered tickets.
4. [`gthirteen:implement`](../.agents/skills/gthirteen/implement/SKILL.md) implements an agreed spec or unblocked ticket.

## Focused workflows

- For Himakom exam archive work, use [`gthirteen:update-exam-archive`](../.agents/skills/gthirteen/update-exam-archive/SKILL.md) and [`exam-archive-import.md`](exam-archive-import.md).
- For a new curriculum edition, use [`gthirteen:add-curriculum`](../.agents/skills/gthirteen/add-curriculum/SKILL.md) and [`curriculum-import.md`](curriculum-import.md).
- For changes to an existing curriculum, use [`gthirteen:modify-curriculum`](../.agents/skills/gthirteen/modify-curriculum/SKILL.md) and the same curriculum guide.
- Before domain exploration, read [`domain.md`](domain.md), `CONTEXT.md`, and relevant files in `docs/adr/`.
- Local issues and ticket statuses follow [`issue-tracker.md`](issue-tracker.md) and [`triage-labels.md`](triage-labels.md).

Use official sources for curriculum data. Keep page provenance and unresolved ambiguity with the source data; do not infer unsupported course codes, credits, or rules. Follow the repository's no-backward-compatibility rule when changing internal contracts.
