---
name: "gthirteen:to-tickets"
description: Break an agreed plan or spec into dependency-ordered implementation tickets published to GitHub Issues.
disable-model-invocation: true
---

# To tickets

Read [`docs/issue-tracker.md`](../../../../docs/issue-tracker.md) and [`docs/triage-labels.md`](../../../../docs/triage-labels.md). This repository tracks specs and tickets on GitHub Issues.

## Process

1. Work from the current conversation or a referenced local spec/ticket. Read the full source and any discussion. Explore the code and read `CONTEXT.md` plus relevant ADRs if the plan has not already been grounded in the repository.
2. Split the work into tracer-bullet tickets. Each ticket should deliver a narrow, complete, observable behavior and fit in a fresh work session. Sequence prerequisites first and list only genuine blockers.
3. Keep each ticket independently verifiable. Avoid unrelated refactors. For a broad API or data migration, sequence a complete migration without compatibility shims; do not preserve old behavior solely for backward compatibility.
4. Present the proposed tickets as a numbered list with a title, blockers, delivered behavior, and acceptance criteria. Ask whether the scope, granularity, and dependencies are right. Revise until the user approves the breakdown.
5. After approval, publish one issue per ticket on GitHub in dependency order. Follow the issue-tracker guide and template below, and label each issue `ready-for-agent`, or use the appropriate label from `docs/triage-labels.md` when it needs information or maintainer review.

Do not create tickets before the user approves the proposed breakdown. Do not modify a parent spec or ticket while splitting it.

## Ticket template

```md
# <Ticket title>

**What to build:** The end-to-end behavior this ticket delivers, from the user's perspective.

**Blocked by:** The issue numbers and titles that gate this one, or "None (can start immediately)".

## Acceptance criteria

- [ ] Observable criterion 1
- [ ] Observable criterion 2
```

Avoid implementation file paths and code snippets unless a prototype contains a compact artifact that captures a decision more clearly than prose. The set is done when every ticket has observable acceptance criteria, dependencies are acyclic and complete, and approved tickets are published to GitHub Issues.
