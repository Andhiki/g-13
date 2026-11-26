# Production error reporting

The `@g13/error-reporting` workspace package emits `server_error` for
unexpected exceptions and `server_response` for 5xx responses. Events contain
a request ID, method, normalized path, service, environment, and schema
version. Exceptions include the error type and capped message and stack.
Response events include the status. The poller joins events by request
ID and groups requests by a fingerprint that ignores stack line numbers.
Messages and stacks can contain private data. Keep report output in the
maintainer-only channel and use sanitized summaries in public artifacts.

## Set up on the Kimaki host

1. Verify Workers Logs and Workers Issues are active for `g-13`. Create an
   account-scoped Cloudflare token with **Account Analytics Read** permission.
   Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the environment
   of the Kimaki process through its secret store or service configuration.
2. Create a private Discord channel restricted to maintainers. Confirm
   `gh auth status` on that host and check that the account can open draft PRs.
   Use a checkout containing the poller and
   [response playbook](../routines/production-500-response.md).
3. Use [SQL API dataset introspection](https://developers.cloudflare.com/analytics/sql-api/datasets/#discover-datasets)
   with `dataset_name=logs.workersLogs`, `include_columns=true`, and
   `include_attributes=true`. Verify `timestamp`, `scriptName`, and the
   structured event attributes in the account. Run the poller once from the
   checkout in a private session and verify it writes state.
4. Create the routine from that checkout. Keep overlapping runs disabled.

```sh
kimaki send --project '<g-13 checkout>' --channel '<private channel>' \
  --send-at '*/10 * * * *' \
  --pre-run 'bun run report-incidents' --agent build \
  --prompt 'Read routines/production-500-response.md and follow it.'
```

The pre-run exits 0 when it prints a report. Exit 1 skips the Kimaki session.
The first two consecutive query failures skip the session. The third sends a
`monitoring_degraded` report. A successful query resets the failure count.
If a query reaches its result limit, it counts as a failure and retains the
cursor. Check the account directly if high log volume causes this condition.

## State and maintenance

The default file is `~/.local/state/g13/error-report.json`. Set
`G13_ERROR_REPORT_STATE` to use another private location outside the checkout.
The poller replaces the state atomically and uses owner-only permissions on
Unix. Use a user-private directory on Windows. Run one poller per state file.
The cursor advances after a successful query and looks back five minutes
on the next run. The first poll starts with a five-minute window. After host
downtime, polling resumes from the cursor within the Workers Logs retention
window.

Each service and environment has its own cursor, cooldown, and fix budget.
A fingerprint is suppressed for 24 hours after reporting. Each service
section lists up to five incidents. After three fix sessions in an hour or
ten in a rolling 24 hours, that service's section carries `reportOnly: true`.

To suppress a known fingerprint, pause the routine, add its 16-character
fingerprint to the state's `disabled` array, and resume the routine. Remove
the entry to re-enable reporting. To rotate the token, set the replacement in
the host's secret store, reload the service, verify one poll and its cursor
advance, then revoke the old token.

## Verification

Run `bun run report-incidents --fixture /path/to/events.json`
with a JSON array of synthetic event objects plus an ISO timestamp on each
object. It requires no credentials and leaves live state untouched. Verify
the report in the private thread using the playbook's fixture dry-run mode.
An empty array returns exit 1.

For live verification, configure a temporary private routine with
`G13_ERROR_REPORT_WORKER=g-13-staging`. The default staging state file is
`error-report-staging.json`. Seed a temporary staging-only failure, confirm
that it produces matching Workers Logs and a private report thread, and verify
that a fixable defect produces a sanitized draft PR against `staging`.
Remove the seeded failure and temporary routine after the check.

## Add a service

Add `@g13/error-reporting` as a workspace dependency. Call
`createErrorReporter({ service, environment, normalizePath, log })` and use
`withServerErrorReporting` at the Fetch boundary or `reportError` where the
framework catches exceptions. Supply route templates for service-specific
identifiers and use the same service and environment names in the runner.

Register a monitored service in
[the service configuration](../packages/error-reporting/scripts/services.ts).
Give it its own state path, plus a log source that reads the requested time
range and returns timestamped events. Reuse the Cloudflare adapter for other
Workers. Omit `draftFix` to report incidents without starting repair work for
that service. To enable draft fixes, set the repository and base branch
explicitly and ensure the Kimaki host has a matching checkout.
