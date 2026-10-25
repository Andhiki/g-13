# 06: Replace recommended electives and share the edited plan

**What to build:** Let students replace a recommended elective from the result, inspect its source requirements, and share the edited roadmap through its URL.

**Blocked by:** 02: Support the 2021 curriculum journey.

**Status:** completed

## Acceptance criteria

- [x] Selecting a recommended elective exposes a replacement action and eligible courses from the chosen curriculum. Keep this out of the quiz.
- [x] Required courses and the chosen minat's wajib-minat courses cannot be removed through elective replacement.
- [x] Show replacement credits and source prerequisites before selection. Replacements cannot duplicate an existing planned course or use incomplete catalog entries as confirmed courses.
- [x] Recompute the plan's credit total, semester loads, and prerequisite connections from the replacement. If scenario checks are available, rerun them and show any new conflicts or credit gaps.
- [x] Preserve valid replacements when changing result controls. Flag a selection that no longer fits rather than silently deleting it.
- [x] Save replacements in the URL with quiz answers and result controls. Refresh, browser history, and opening the shared link restore the edited plan.
- [x] Reject unknown course IDs, cross-curriculum replacements, attempts to replace required courses, and malformed URL data without crashing or corrupting the baseline.
- [x] Provide a working copy-link action with success or failure feedback and an accessible fallback if clipboard access fails.
- [x] Add tests for valid replacement, protected courses, duplicate prevention, changed credits and prerequisites, invalid URLs, and restoration of an edited plan. Verify replacement and sharing on desktop and mobile.

## Comments

This slice can proceed alongside tickets 03 and 04. Once ticket 05 is present, its conflict checks must consume the edited course set.

## Verification

Implemented with planner and URL behavior tests plus desktop and mobile browser coverage. Source uncertainties remain visible in the result rather than becoming invented academic rules.
