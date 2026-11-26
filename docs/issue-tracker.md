# Issue tracker

All specs and implementation tickets live on **GitHub Issues** (`Andhiki/g-13`).
There is no local tracker. Publish a spec as its own issue, then one issue per
ticket, referencing blockers by issue number.

Keep every issue self-contained — external contributors and agents read only
GitHub. An issue carries what to build, acceptance criteria, and Blocked by
(referencing issue numbers). Discussion happens in issue comments; append
settled decisions back into the issue body.

Labels replace ticket status. Use the values from
[triage-labels.md](triage-labels.md); completed issues are closed.

Publishing requires the `gh` CLI, authenticated as an account with write
access (check with `gh auth status`). If `gh` is missing, report back and ask
the user to approve installing it — never install unprompted. If it is not
logged in, stop and ask the user to log in (`gh auth login`).

## Pull requests

A PR that completes a ticket must have `Closes #123` or `Resolves #123` on
its own line in the PR description. Repeat the keyword for each completed
ticket. For related or partially completed tickets, use `Refs #123`.

[GitHub only applies closing keywords to PRs targeting the default branch](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue).
Use them in PRs to `staging` too. After a staging merge, confirm the ticket's
acceptance criteria are met and close it if it is still open. A promotion PR
to `main` can include closing keywords for any completed tickets still open.
