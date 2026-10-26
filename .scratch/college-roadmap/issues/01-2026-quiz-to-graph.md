# 01: Build the 2026 quiz-to-graph journey

**What to build:** Let a new student open `/roadmap`, select curriculum 2026 and a peminatan through full-screen quiz steps, and receive an individual-course roadmap. Deliver the regular-class path without optional Magang first. The baseline is a working journey, not a static quiz mockup.

**Blocked by:** None (can start immediately).

**Status:** completed

## Acceptance criteria

- [x] `/roadmap` is reachable from the existing app and links back to the peta kurikulum.
- [x] Show one question per screen with AlignUI answer buttons, explicit Continue, and Back. Omit the progress bar and extra page title. Preserve answers when revisiting a step and require an answer before continuing.
- [x] Match existing app typography, colors, house controls, focus behavior, and light and dark themes. Support keyboard selection and mobile screens without horizontal page overflow.
- [x] Offer all six source-backed 2026 peminatan. Keep source naming differences understandable.
- [x] For the regular-class, no-optional-Magang path, render every planned course individually in semester lanes with prerequisite connections and course details. Keep compulsory Kerja Praktik.
- [x] Include all required and selected wajib-minat courses once. Preselect relevant electives toward the minimum credit total, distinguish recommendations from requirements, and show any remaining credit gap.
- [x] Handle generic religion selection without guessing the student's religion. Repeated source placements do not duplicate courses or credits.
- [x] Preserve raw prerequisite conditions and expose unresolved source rules instead of claiming academic eligibility.
- [x] Validate URL answers against the chosen curriculum. Restore the same baseline result on refresh and through a copied result link. Incomplete or invalid URLs return to an appropriate quiz step without crashing.
- [x] Changing the curriculum or peminatan clears only incompatible downstream choices.
- [x] Add behavior tests for the generated required-course set, credit accounting, URL validation, and a full quiz-to-result browser flow. Inspect the quiz and graph at desktop and mobile widths.

## Comments

IUP, optional Magang, and graduation-target controls are completed by later tickets. Until those paths work, do not offer choices that produce fabricated results.

## Verification

Implemented with planner and URL behavior tests plus desktop and mobile browser coverage. Source uncertainties remain visible in the result rather than becoming invented academic rules.
