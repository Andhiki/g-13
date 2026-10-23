# Peta Kurikulum Ilmu Komputer UGM — discovery

Status: exploration and interview in progress; curriculum explorer, public community standing, support for 2021 and 2026, and adaptation of the reference interaction/design are accepted. Other recommendations remain proposals.
Checked: 22 October 2026.

## Brief

Explore adapting https://course.csui.dev/ for S1 Ilmu Komputer UGM. Deliver evidence, thoughts, an implementation plan, and required resources before implementation. User requested GPT-6 Luna with maximum reasoning for delegated exploration; three workers cover reference/source audit, UGM data, and scope/resources.

## Confirmed reference behavior

Observed directly in the browser:

- Semester-based prerequisite graph, pan/zoom controls, and a list alternative.
- Search, program selector, elective grouping, theme and sound controls.
- Keyboard instructions for prerequisite traversal and focusing a course path.
- Course detail panel with code, credits, semester, category, prerequisites, downstream courses, description, topics, outcomes, and references.
- Selecting a course sets a shareable `mk` URL parameter alongside `prodi`.
- FAQ distinguishes passed prerequisites from previously attended prerequisites. These are UI rules and must not be imported as UGM rules.

Reference: https://course.csui.dev/?prodi=CS&mk=CSGE601020

## UGM sources and important uncertainty

- https://dcse.fmipa.ugm.ac.id/s1-ilkom/s1ik-matakuliah/ explicitly describes curriculum 2021, course tables, prerequisite notation, electives, and transition rules. Do not label this automatically as the latest curriculum.
- https://mipa.ugm.ac.id/id/student-affairs-id/ lists both undergraduate curriculum 2026 and curriculum 2021 revision 2023.
- Listed 2026 document: https://simpan.ugm.ac.id/s/fU4fDblvuib8DLN — contents and Ilkom applicability under investigation.

The 2021 departmental page says unstarred prerequisites require prior attendance through the final examination; a single star permits concurrent enrollment. A generic edge called 'must pass' would therefore misrepresent this source.

## Proposed product direction

Begin with a public curriculum explorer: map + accessible list + search + course details + sources + visible curriculum version. Validate usefulness and data accuracy before personal KRS planning.

Do not derive enrollment eligibility solely from graph reachability. Minimum credits, grades, concurrent enrollment, alternatives, MBKM, and equivalencies may require separate rules.

Proposed initial technical shape: static frontend, versioned structured curriculum data, generated prerequisite/reverse-prerequisite indexes. Framework and reuse decision remain open pending source audit. Backend and accounts are not prerequisites for an informational map.

## Source reuse audit

The reference audit worker found contributor GitHub profile links but no identifiable public project repository or code license in its bounded checks of the site, assets, and public contributor repositories. This is a search limitation, not proof that a repository does not exist. Do not assume that visible browser-delivered code or branding has a reuse license. Recommendation: independently implement the interaction ideas unless a usable source license is subsequently verified.

Reference asset paths indicate Next.js App Router. Exact implementation dependencies should remain tentative until verified by a repository or stronger asset evidence.

## Resources and effort (planning estimates)

- One frontend implementer, one curriculum data curator (may be the same person), and an academic reviewer familiar with the selected curriculum.
- Official curriculum documents and course relationships, source/page references, a change log, and a named data maintainer.
- A code repository, existing static hosting account, and optionally a domain. No recurring cost is quoted without choosing a provider and checking its current plan.
- Estimated part-time prototype: 1–2 weeks. Updated estimate for a sourced two-version pilot: 3–5 weeks total, subject to extraction conflicts and reviewer availability. These are planning estimates, not delivery promises.

## Proposed validation sequence

1. Resolve version/cohort and provenance; reconcile conflicting sources before declaring rules verified.
2. Build a small representative data slice including concurrent enrollment, attendance-based prerequisites, and non-course credit requirements where documented. Preserve unknowns explicitly.
3. Implement map/list/search/detail from the same dataset. Validate unique IDs, existing prerequisite targets, credits, and rule semantics. Detect cycles but distinguish legitimate concurrent groups from impossible strict prerequisite cycles.
4. Review every published course and prerequisite rule against its source. Pilot with 5–8 students and an academic reviewer; measure task completion and incorrect rule interpretation.
5. Publish with a visible data version/check date, correction route, and responsible maintainer.

Potential later scope: personal completion checklist, KRS planning, cross-program/MBKM equivalencies, historical cohort transitions, and live offerings. None is assumed included in the first release.

## Design tree

### AlignUI design system interview, 23 October 2026

Accepted: use [AlignUI base components and foundations](https://alignui.com/docs/v1.2/introduction) as the default source for component implementations and design tokens. Keep brand overrides documented. Curriculum-specific elements, including course nodes and prerequisite connections, remain custom and follow the same visual system.

Accepted: adopt AlignUI's default visual foundation, including colors, typography, and control styling. Replace the current green/cream palette and Figtree rather than retaining them as brand overrides.

Accepted: migrate the entire existing app, including controls, course cards, list view, and course detail panel. Preserve the current layout and curriculum behavior while applying AlignUI's default visual foundation throughout.

Accepted: support both light and dark themes using AlignUI's theme tokens. Follow the system preference initially and provide a persistent manual theme toggle. Course states and prerequisite connections must remain readable in both themes.

Accepted: use AlignUI's free base components. Pro components are outside the migration scope. Style custom curriculum elements with the same tokens.

Accepted: distinguish the selected course, its prerequisites, and courses that depend on it. Use AlignUI's primary color for selection and separate theme colors for the two relationship directions. Provide arrows and text labels so color is not the only distinction. These states describe relationships, not personal enrollment eligibility.

These decisions establish the intended direction. The current custom controls and CSS have not yet migrated.

### Approved migration ticket breakdown

The user approved these five implementation slices. Published as individual local Markdown tickets in `.scratch/alignui-migration/issues/`, using the default triage labels. Tracker conventions are in `docs/agents/issue-tracker.md`.

1. App shell and theme switching. No blockers. Establish AlignUI's free foundations and default typography, migrate shell controls, and deliver both themes with system preference and a saved manual toggle.
2. Search and curriculum filters. Blocked by ticket 1. Migrate search, curriculum selection, filters, and map/list switching while preserving filtering behavior and shareable URLs.
3. Course list and detail panel. Blocked by ticket 1. Migrate course rows, badges, and detail panels while preserving prerequisite text, source attribution, and mobile access.
4. Curriculum map and relationship states. Blocked by ticket 1. Restyle course nodes, connections, and map controls, with distinct selection and relationship states using theme colors, arrows, and labels.
5. Finish migration and verify the whole app. Blocked by tickets 2, 3, and 4. Remove obsolete styles and verify both curricula, themes, mobile layouts, keyboard access, and direct links.

- Root: primary job (open Q1).
  - Curriculum explorer -> curriculum/cohort coverage -> data contract -> map/list interactions.
  - Personal KRS planner -> eligibility semantics -> local/cloud state -> privacy and integrations.
- Root: project standing (open Q2).
  - Community -> source attribution, correction workflow, named maintainer.
  - Official -> institutional ownership and approval arrangements.
- Factual prerequisite: original source availability/license -> reuse versus independent build.
- Factual prerequisite: 2026 document contents -> proposal for initial curriculum coverage.

## Interview round 1

Q1: Agree to focus first on helping S1 Ilkom UGM students understand courses and prerequisites? Recommended: curriculum explorer first, personal KRS planning later.

Q2: Agree to position this initially as a public student-community project with clear official sources? Recommended: community project until institutional partnership exists.

User answers: Q1 accepted (curriculum map first); Q2 accepted (public community project); Q3 chose both 2021 and 2026 at MVP; Q4 accepted adapting core reference flows and UGM design. Personal KRS planning remains potential later work. No ADR has been accepted; do not turn other proposals into decisions.

## Curriculum 2026 discovery

The UGM data worker downloaded and extracted the official 2026 PDF. It contains S1 Ilmu Komputer chapter 3.2, course table 3.12 (printed pp.168–170), electives in six interest areas (pp.170–174), 2021-to-2026 equivalencies in table 3.13 (p.175), and transition rules (pp.175–176). It applies to entrants 2026 onward; earlier cohorts are not required to switch. User selected both versions for the initial release.

The user supplied the main 2026 PDF. SHA256: `ffa6d141c99228b79092d9da647f47e9b37d2966f6aca8ca9567de8b7a506520`; 505 PDF pages. Printed p.154 corresponds to PDF page172 (1-based). The previously downloaded official PDF differs in bytes but has the same page count and identical extracted text on spot-checked printed pages154,168,169,170,175,176. The uploaded file takes precedence for extraction.

Parent visual check of printed p.170 confirms `*` means previously taken, not necessarily passed; it does not mean concurrent enrollment in this version. The printed KKN group includes an operational ambiguity about KKN-PPM itself being grouped under 'before KKN'; retain the text and request interpretation rather than creating a self prerequisite. Proposal Tugas Akhir repeats across semesters6/7/8. Repeated placement is not a separate course.

Table3.7 (p.154) reports a minimum144SKS:109 required,9–15 WM,20–26 free elective. These figures must be reconciled with extracted records before the dataset is called verified.

## Interview round 3 (accepted)

Q5: User accepted informational rules only. No transcript/history input or personal KRS eligibility evaluation in the initial scope.

Q6: User clarified the maintainer is their own team of friends, not Himakom. No institutional affiliation or academic reviewer commitment is assumed.

## Extraction work now authorized

User explicitly requested cheap-model extraction of the supplied main source. GPT-6 Luna workers extracted 2026 from the upload and2021 from the official revision2023 source into separate structured datasets and source-page companions. Parent readback, hash, provenance, credit-reconciliation and count checks passed; see verification.md. Source ambiguities remain recorded. No website implementation has been started.

Supporting two versions adds data curation and comparison effort beyond the original single-version estimate. Re-estimate after record counts and unresolved source conflicts are known.

## 2021 revision conflict

The 2021 extraction worker verified the official 2021 revision 2023 PDF through DIKE's academic-documents page. It reports 104 required SKS and a minimum 40 elective SKS (printed p.251/PDF266 and printed p.258/PDF273). The old departmental HTML reports 98+46. Keep this disagreement visible; the edition label must include the revision, and a bare year is insufficient provenance. Required-course Table 3.26: printed pp.256–258/PDF271–273; elective Table 3.27: printed pp.259–263/PDF274–278; equivalency/transition: printed pp.264–266/PDF279–281. The parent visually checked PDF266 and PDF273: the 104+40 figures and 2021 prerequisite/concurrent legend are confirmed. This is a source spot-check, not full academic approval of the dataset.

## Project location

User requested the project directory `C:\.Projects\g-13`. It was created after checking the existing parent directory. Workers finish in the original scratch workspace; finished documentation and extraction artifacts are copied to the requested project directory and hash-checked before handoff.
