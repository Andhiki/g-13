---
name: "gthirteen:grill-with-docs"
description: Use when the user wants to stress-test a plan against this project's language, domain model, and decisions.
---

Interview the user about the plan until the goal and important decisions are clear. Walk through the branches and their dependencies one question at a time. For each question, recommend an answer. If the codebase can answer it, inspect the code instead of asking.

## Explore the domain

Before domain exploration, read [`AGENTS.d/domain.md`](../../../../AGENTS.d/domain.md), [`CONTEXT.md`](../../../../CONTEXT.md), and relevant decisions in `docs/adr/`. Use the project's terms and point out conflicts between the user's wording, the glossary, code, and recorded decisions.

Ask focused questions to resolve vague terms and boundaries. Use concrete scenarios to probe edge cases and relationships. Keep interviewing while answers would change the proposed behavior or its scope.

## Record decisions

Update `CONTEXT.md` inline when the user resolves a domain term. Keep it a glossary; implementation details and decisions belong elsewhere. Use [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

Offer an ADR only when a decision is hard to reverse, surprising without context, and the result of a real trade-off. Create it under `docs/adr/` with the next sequential number and use [ADR-FORMAT.md](./ADR-FORMAT.md).

Finish when the user and agent share a clear problem, canonical terms, scope, and resolved decisions. Summarize those decisions and any remaining open questions.
