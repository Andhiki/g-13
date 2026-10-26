# Agent instructions

Be concise and straightforward.

## Changelog

Before completing user-facing changes (features, behavior or UI changes, bug fixes,
or curriculum/prerequisite corrections), update `CHANGELOG.md` under `Unreleased`.
Read `CONTRIBUTING.md#changelog` for date grouping, categories, and source requirements.
Ensure each user-facing change in your task is covered once; extend an existing
entry when refining the same change. Internal refactors, tests, tooling, and
documentation edits without user-facing impact need no entry. Keep entries under
`Unreleased` until a release is confirmed.

## Local browser preview fallback

When Playwright's cached Chromium fails to start because Linux shared libraries such as `libatk-1.0.so.0` are missing, use the libraries bundled with the local JetBrains RemoteDev/WebStorm runtime.

1. Locate the active `selfcontained/lib` directory under `/home/molly/.cache/JetBrains/RemoteDev/dist/`. Verify with `ldd` that Chromium has no unresolved libraries when that directory is supplied through `LD_LIBRARY_PATH`.
2. Launch the temporary Node/Playwright script with both overrides scoped to the browser command:

```bash
LD_PRELOAD=/usr/lib/libstdc++.so.6 \
LD_LIBRARY_PATH=/home/molly/.cache/JetBrains/RemoteDev/dist/<active-runtime>/plugins/remote-dev-server/selfcontained/lib \
node <playwright-script>.mjs
```

`LD_PRELOAD` prevents the JetBrains runtime's older `libstdc++.so.6` from breaking the system Node binary. Keep these overrides out of project configuration. Remove the temporary preview and Playwright script after verification.

## Agent skills

### Pull request descriptions

Before writing or updating a PR title/body, read `.agents/skills/pr-body/SKILL.md`
and use the repository PR template.

### Issue tracker

Local Markdown tickets. Read `docs/agents/issue-tracker.md` before creating or updating tickets.

### Triage labels

Use the default roles in `docs/agents/triage-labels.md` when assigning ticket status.

### Domain docs

Single context. Read `docs/agents/domain.md` before domain exploration.
