# 03: Plan optional Magang in both curricula

**What to build:** Ask whether the student wants optional Magang, reveal a duration follow-up when needed, and show the resulting internship activity and course load in the roadmap.

**Blocked by:** 02: Support the 2021 curriculum journey.

**Status:** completed

## Acceptance criteria

- [x] Show the Magang question as its own full-screen step. A yes answer reveals a curriculum-appropriate duration follow-up. Back preserves valid answers, and a no answer removes obsolete optional internship choices.
- [x] In 2026, retain compulsory Kerja Praktik for either answer. Show optional short, medium, long, and full-semester tiers as 4, 8, 12, and 16 additional SKS, counted with the 4-SKS Kerja Praktik once.
- [x] Expose source-backed 2026 outside-program activity courses with their credits, prerequisites, and page references through the existing data conventions.
- [x] Distinguish between-semester Kerja Praktik from an optional internship during the semester. The 20-SKS combined option occupies a full semester and cannot be placed in a semester break.
- [x] Check an authoritative 2021 source or internship guide for duration and recognition rules. If the mapping is unavailable, collect intended duration as a preference and show recognition as unresolved. Do not invent month-to-credit mappings or reuse 2026 tiers.
- [x] Use actual 2021 internship modules only when supported by the recognition rules. Provisional activities do not silently satisfy the elective-credit target.
- [x] Show internship timing and its impact on semester course loads. Surface activity overlaps for later scenario checks.
- [x] Preserve the answers and resulting activity through refresh and shared links.
- [x] Add tests for no-Magang behavior in each curriculum, all 2026 tiers, maximum combined credits, and unresolved 2021 recognition. Verify the conditional follow-up and result on desktop and mobile.

## Verification

Implemented with planner and URL behavior tests plus desktop and mobile browser coverage. Source uncertainties remain visible in the result rather than becoming invented academic rules.
