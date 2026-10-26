---
name: pr-body
description: Write or update a g-13 pull request title and body from the actual diff, verification results, and curriculum sources. Use when preparing a PR description for this repository.
---

# g-13 PR body

Read `.github/PULL_REQUEST_TEMPLATE.md`, then inspect the diff against the intended
base branch. For an existing PR, include all changes in its final scope rather
than only the latest commit. Use `CONTEXT.md` for curriculum terminology.

Fill the repository template in Indonesian or the language requested by the user.
Lead with the user-visible problem and resulting behavior. Keep small PRs brief;
include a before/after example when it makes the change easier to assess.

Report verification from actual command results: command, outcome, and material
limits. Leave unrun checks unchecked and explain them. Distinguish local results
from GitHub CI. For UI changes, attach a screenshot only if capture succeeded;
otherwise describe the interaction checked and missing evidence.

For curriculum or syllabus changes, include version, course code, official source,
page, and corrected value. Describe unresolved academic interpretation separately.
For third-party code/assets, identify the source, license, and notice retained.
Read `THIRD_PARTY_NOTICES.md` when those materials change.

Add a short risk or follow-up paragraph when behavior, deployment, or data has a
material limitation. Describe the final implementation, excluding unrelated local
changes and abandoned approaches. A documentation-only PR needs no invented
runtime test or diagram.

Writing a body does not authorize publishing a PR. When creation/update is also
requested, preserve real newlines with a structured tool argument or `gh --body-file`.
Return the PR URL and report checks as observed, without claiming pending CI passed.
