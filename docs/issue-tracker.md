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
