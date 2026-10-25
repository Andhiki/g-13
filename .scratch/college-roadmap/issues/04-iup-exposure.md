# 04: Plan IUP international exposure

**What to build:** Ask IUP status, reveal an exposure follow-up for IUP students, and place the chosen activity in the graph with a semester-6-or-7 control where applicable.

**Blocked by:** 02: Support the 2021 curriculum journey.

**Status:** completed

## Acceptance criteria

- [x] Ask IUP status on a full-screen quiz step. IUP students receive an exposure question with source-supported activities and an undecided option. Regular-class students skip it.
- [x] Use curriculum-specific source descriptions for exchange, international internship, short courses or workshops, competitions, presentations, and double degree.
- [x] For exchange and international internship, allow choosing semester 6 or 7 in the result. Label this as a planning choice rather than a mandatory source schedule.
- [x] A semester exchange reserves the relevant semester. Short exposure activities do not reserve an entire semester. Preserve duration uncertainty where the source does not establish a single duration.
- [x] Treat double degree as a distinct multi-semester path. Show unresolved host requirements and duration rather than squeezing the activity into an ordinary one-semester exchange. Respect the 2026 exemption from choosing a minat.
- [x] An undecided answer produces a visible unresolved exposure milestone rather than dropping the IUP graduation requirement.
- [x] Keep host-course equivalencies and unapproved recognition unresolved. Do not automatically award exchange credits or count exposure as completion of unrelated courses.
- [x] Non-IUP selection removes stale exposure answers. Exposure choices and semester controls survive refresh and shared links.
- [x] Add tests for conditional navigation, undecided exposure, short activities, both exposure semesters, curriculum-specific duration differences, and double-degree handling. Verify controls on desktop and mobile.

## Comments

This slice can proceed alongside optional Magang. Their combined overlap and double-counting checks belong to ticket 05.

## Verification

Implemented with planner and URL behavior tests plus desktop and mobile browser coverage. Source uncertainties remain visible in the result rather than becoming invented academic rules.
