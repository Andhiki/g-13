# Peta Kurikulum Ilkom UGM — proposed build plan

## Accepted scope

A public community curriculum navigator maintained by the user and their friends. Support both 2021 and 2026 curriculum versions at MVP. Adapt the reference site's core flows and create an appropriate UGM design. Display academic requirements; do not collect transcripts or evaluate personal KRS eligibility in this scope.

## Product recommendation

Use one explicit curriculum selector that stays visible in map, list, course details, and shareable URLs. Provide course search, semester navigation, prerequisite/downstream paths, credits, and interest/elective filters. Treat mobile list view as a first-class path through the same data. Let users access source pages and clearly distinguish a published curriculum plan from actual semester offerings.

The source documents contain placement options, prerequisites, and credit or timing rules. Preserve those distinctions. For example, a minimum60SKS rule is a requirement note, not a course node. A repeated Proposal Tugas Akhir row is one course with multiple placement options. WM courses are mandatory within a chosen interest, not universally mandatory.

## Proposed implementation

React + TypeScript + Vite with React Flow for pan/zoom, nodes, and directed relationships; use normal HTML for the list and detail view. Keep versioned JSON data in the repository. The frontend derives reverse relationships from the canonical prerequisite data. Use simple deterministic semester-column placement before considering automatic graph layout.

These are recommendations, not installed dependencies or a claim that the reference uses this exact stack. React Flow documentation: https://reactflow.dev/learn ; Vite static deployment: https://vite.dev/guide/static-deploy.html . Original source reuse remains unverified, so independently implement the design rather than copying browser-delivered code/assets.

## Work packages and gates

1. **Curate data.** Extract both versions, retain source pages and raw prerequisite strings, reconcile HTML/PDF differences, flag unresolved rules. Require unique identities within each version, valid referenced targets, reviewed credit totals, and complete provenance.
2. **Confirm data model against hard cases.** Cover attendance vs passing, concurrent exceptions, credit thresholds, WM membership, religion alternatives, duplicated semester placements, and many-to-one equivalencies. Do not silently infer missing rules.
3. **Prototype key flows.** Select curriculum, find course, open details, inspect prerequisites/downstream relationships, follow a shareable link, and use the mobile list. The graph is an explanation of sourced rules; it does not declare personal eligibility.
4. **Audit and pilot.** Review every displayed requirement against the source, then test with 5–8 students. Record task completion and incorrect interpretations. Ask someone familiar with Ilkom academic policy to review ambiguous labels before public release.
5. **Publish and maintain.** Provide source/check date, version history, correction issues, and named responsibility inside the friend team. Recheck data after new academic guidance; update individual claims rather than declaring all data current from a single date.

## People and resources

- Frontend owner: map/list/search/details, responsive behavior, keyboard use.
- Data owner: source extraction, conflict queue, course/requirement audit. This may overlap with the frontend owner.
- Second reviewer: independently checks source transcriptions and UI interpretation. Seek academic clarification for unresolved policy questions; no institutional relationship is assumed.
- 5–8 pilot students across the covered curriculum cohorts.
- Main 2026 source uploaded by user; official 2021 revision 2023 PDF and departmental pages as comparison sources.
- Git repository, issue tracker, static hosting account, optional custom domain. Provider/cost choice is still open; no paid backend is needed for the accepted informational scope.

## Effort estimate

For a small part-time team, allow roughly 1–2 weeks for a representative clickable prototype and 3–5 weeks total for a reviewed two-version pilot. This is a planning estimate, not a delivery promise. Revise it after extraction reveals record counts, source conflicts, and review availability. A visually complete prototype can be ready before its academic data is ready for public reliance.

## Deliberately deferred

Personal course history, grades, KRS eligibility, live schedules/seats, enrollment, degree audit, and automatic MBKM/equivalency approval. These require a different data and validation scope.

## Current status

Reference exploration and the scope interview establish the accepted navigator brief. GPT-6 Luna extracted the two sources, and the parent independently checked the structured files and source totals; see [verification](verification.md). A local React, TypeScript, Vite, and React Flow prototype now supports both curriculum versions, search, shareable course URLs, map/list views, semester navigation, course details, source-page references, and interest/elective filters. The 2026 P courses appear under free choice, not as requirements of a chosen interest.

`npm run build` passes. Manual Edge browser checks verified 2021 Revisi 2023, search and course selection, a shareable `kurikulum`/`mk` URL, semester-1 list filtering, switching to 2026, and a 390px mobile viewport with no horizontal overflow or uncaught page errors. The desktop map was visually inspected; its first view shows up to four matched relationships per side, while the detail panel lists all matched relations. The graph only links exact course-title matches and keeps raw source text visible. Vite reports an 802.9 kB minified JavaScript bundle (172.4 kB gzip), which is a follow-up optimization before broader release.

This remains a prototype, not a reviewed academic reference. The friend team still needs to audit each displayed rule against its source, clarify unresolved extraction items, and pilot with 5–8 students before publication.
