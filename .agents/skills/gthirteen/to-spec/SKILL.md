---
name: "gthirteen:to-spec"
description: Turn an agreed request into a behavior spec and save it in this project's local issue tracker.
disable-model-invocation: true
---

Synthesize the current conversation and codebase into a spec. Do not interview the user; use [`gthirteen:grill-with-docs`](../grill-with-docs/SKILL.md) first when important product or domain decisions are still open.

## Process

1. Read [`AGENTS.d/issue-tracker.md`](../../../../AGENTS.d/issue-tracker.md), [`CONTEXT.md`](../../../../CONTEXT.md), and relevant decisions in `docs/adr/`. Explore the code when needed to describe the current behavior accurately.
2. Identify the highest useful seam for testing the requested behavior. Prefer existing seams and keep the number of seams small. If the choice would change scope or architecture, present it to the user and resolve it before writing the spec.
3. Write the spec to `.scratch/<feature-slug>/spec.md` using the template below. The local issue tracker guide is authoritative; do not publish to an external tracker.

## Spec template

```md
## Problem Statement

Describe the user's problem.

## Solution

Describe the resulting behavior from the user's perspective.

## User Stories

1. As a <actor>, I want <behavior>, so that <benefit>.

## Implementation Decisions

Record relevant module boundaries, interfaces, domain decisions, schemas, API contracts, and interactions. Avoid file paths and code snippets unless a prototype contains a compact artifact that expresses a decision more clearly than prose.

## Testing Decisions

Describe observable behavior to test, the relevant modules, and prior examples in the codebase.

## Out of Scope

List related behavior this spec does not cover.

## Further Notes

Add source references or remaining context needed by implementation.
```

Keep user stories complete without repeating the same behavior in different words. The spec is ready when its scope, user-visible behavior, implementation decisions, test seams, and out-of-scope items are clear enough to split into tickets or implement directly.
