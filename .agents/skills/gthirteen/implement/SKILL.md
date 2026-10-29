---
name: "gthirteen:implement"
description: Implement an agreed spec or an unblocked ticket in this repository.
disable-model-invocation: true
---

Implement the user's request from the agreed spec or ticket. For a local ticket reference, read it and its parent spec, confirm the title, and check its blockers in `.scratch/<feature-slug>/issues/`. If the ticket is blocked or the reference is ambiguous, resolve that before editing.

## Process

1. Read `AGENTS.md`, the relevant spec or ticket, `CONTEXT.md`, and applicable source guides and ADRs. Confirm the acceptance criteria and work only on an unblocked slice.
2. Make the smallest complete change that satisfies the agreed behavior. At seams identified in the spec, use behavior-focused tests and a test-first workflow when appropriate. Keep project data and user-facing copy aligned with their authoritative sources.
3. Run the checks required by the project and task. For ordinary code changes, use `bun run check` and `bun run build`; inspect relevant UI or behavior in the running application when it affects the user experience.
4. Review the full diff against the spec and repository conventions. Fix issues found. Update `CHANGELOG.md` under `Unreleased` for user-facing changes, following `AGENTS.md` and `CONTRIBUTING.md#changelog`.
5. Mark a completed local ticket `Status: completed` and commit the finished work on the current branch. Report checks that were not run and any remaining blockers.

Done means the accepted behavior is implemented, relevant checks pass, the diff matches the spec, required project records are updated, and the commit is created.
