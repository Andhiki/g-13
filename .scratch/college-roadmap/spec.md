# College roadmap

## Agreed experience

Build `/roadmap` as a full-screen quiz that produces a graph of the student's college journey. Always assume the student starts in semester 1.

Match the existing app's typography, colors, theme support, and house controls. Show one question per screen, large answer choices, progress, Back, and an explicit Continue action. Preserve answers when moving backward. Use conditional follow-ups rather than a long form. There are no timers or scores.

The quiz collects:

- Curriculum version, 2021 or 2026.
- Peminatan appropriate to that curriculum.
- IUP status. An IUP answer reveals an international-exposure question, including an undecided choice.
- Whether the student wants optional Magang. A yes answer reveals a duration question appropriate to that curriculum.

The result shows every planned course individually in semester lanes, including prerequisite connections and relevant activities. Reuse the current graph's course appearance, navigation conventions, and course details. Include all required courses, deduplicate repeated semester placements, and preselect electives relevant to the chosen peminatan. Users can replace electives in the result.

Put graduation targets of 7 and 8 semesters in the result, not in the quiz. For an IUP exchange or international internship, also allow switching the exposure semester between 6 and 7. Short exposure activities do not reserve a whole semester.

If a 7-semester scenario cannot accommodate the choices, keep that scenario inspectable, show specific conflicts, and recommend the 8-semester alternative. Never hide required courses or silently exceed the planning limit to claim a scenario fits.

Save quiz answers and result controls in the URL. Refreshing or opening a shared link restores the same plan, including elective replacements. No account is required.

## Source findings

Use the repository's PDFs and extracted course data. Keep academic rules scoped to their curriculum version.

### Curriculum 2021, revision 2023

The source describes four elective laboratory groups, not four equivalents of the 2026 wajib-minat structure:

- Algoritma dan Komputasi.
- Sistem Cerdas.
- Rekayasa Perangkat Lunak dan Data.
- Sistem Komputer dan Jaringan.

The four groups appear on printed page 236 and in the elective catalog on printed pages 259–263. Software and data share one laboratory group in this version.

The controlling totals are 104 required SKS and 40 elective SKS, for 144. The schedule includes six alternative religion courses, generic elective slots, and repeated thesis placements. A personal plan must count one religion choice, replace elective slots with actual courses, and count each course once. Do not choose a student's religion automatically.

Internship activities are listed as separately credited modules in the elective catalog. A reliable duration-to-credit conversion for 2021 has not been established. Do not import the 2026 tiers or count a proposed module bundle as approved credit recognition.

The source's starred prerequisite convention permits concurrency. Unstarred prerequisites must already have been taken through the final examination. Keep raw conditions visible where the existing relation extraction cannot resolve them.

### Curriculum 2026

Printed pages 167 and 181 describe six peminatan:

- Analisis Data.
- Komputasi Cerdas.
- Kecerdasan Artifisial.
- Rekayasa Perangkat Lunak.
- Infrastruktur Komputasi.
- Kewirausahaan Digital, called Wirausaha Digital in the course table.

Pemilihan minat happens at the beginning of semester 4. Wajib minat is compulsory for the selected minat. The source permits double-degree students not to select a minat. Do not silently enforce the ordinary minat rule for a double-degree plan.

The source states 109 required SKS, 9–15 wajib-minat SKS, and 20–26 elective SKS, with at least 144 SKS overall. Repeated semester placements are alternatives, not extra required credits.

Kerja Praktik is compulsory and worth 4 SKS. Optional Magang adds one of four tiers: 4, 8, 12, or 16 SKS. The combined maximum is 20 SKS. The outside-program activity table is on printed page 174. The course adapter exposes these rows from the extracted JSON, including source-page references.

Printed pages 176–177 distinguish an approximately two-month internship between semesters, recorded as Kerja Praktik in semester 6 or 7, from an internship during a semester, available from semester 6. Exact conversion between internship duration and optional credits refers to a separate program internship guide. The 20-SKS option occupies a full semester, not a break.

The source's starred prerequisite convention differs from 2021: the prerequisite has been taken previously but need not have been passed. Preserve source ambiguities, including same-semester practical placements, rather than inventing concurrency rules.

### IUP

Both versions require international exposure for international-class students. They offer several forms, not a universal semester abroad: exchange, international internship, short course or workshop, international competition, international presentation, and double degree.

The durations differ across versions. Double degrees in particular cannot be reduced to an ordinary semester-6-or-7 exchange. An undecided or unsupported exposure plan must remain explicitly unresolved in the graph.

The UI's semester-6-or-7 choice is a planning scenario, not a claim that the PDF mandates those semesters. Credit recognition and host-course equivalencies require confirmation. Do not automatically count the same international internship twice as two activities or credit awards.

## Planning boundaries

The result is a suggested roadmap, not a KRS or a guarantee of graduation eligibility. Show course credits and per-semester totals from the actual plan. Explain which conflicts the planner checks and which source conditions remain unresolved.

Use source-backed placement guidance, known prerequisites, and verified credit limits. Flag unsupported conversions, missing prerequisites, conflicting full-semester activities, unmet credit totals, and work that remains beyond the selected graduation target. If the 8-semester alternative also has conflicts, show those too.

Actual offerings, future grades, personal SKS entitlement, host-university equivalencies, and advisor approval are not known from the quiz. Do not present assumed passes or provisional recognition as verified facts. Keep elective recommendations distinct from official wajib-minat requirements.

## Delivery

The six approved tickets are published in `issues/`, numbered in dependency order. All six are implemented and marked completed; their original blocking references remain for context.

The slices cover a working 2026 baseline, 2021 support, optional internships, IUP exposure, graduation scenarios, and elective replacement. Each ticket includes its own behavior tests and responsive browser verification. No separate horizontal testing or infrastructure ticket is needed.

## Deferred

- Kanban and completed-course tracking.
- Planning from a semester other than semester 1.
- Accounts and server-side plan storage.
- An exhaustive academic eligibility engine or invented source rules.

## Verification evidence

This spec comes from the conversation, the current app and adapters, the extraction notes, and text extracted directly from both source PDFs. The roadmap is implemented. Planner and URL tests cover both curricula; desktop and mobile browser tests cover quiz navigation, conditional answers, graph results, result controls, elective replacement, sharing, and restoration. Responsive inspection at 1440, 768, and 390 pixels passed with one small-text warning for the overview graph. Academic approval and actual future offerings remain outside this verification.
