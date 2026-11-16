# Keep moderation UI in the app and reusable auth in a shared package

For [#27](https://github.com/Andhiki/g-13/issues/27), the protected moderation UI
lives at `/admin` in `apps/web`; reusable authentication/session integration and
role policy belong in `packages/auth` (`@g13/auth`), not in the lecturer-review
feature. This keeps application/framework wiring separate from reusable identity
policy without creating a second admin application. The app owns routes, UI,
request handling and Cloudflare binding access; `packages/env` retains runtime
configuration validation and `packages/db` retains shared Drizzle schema/SQL
ownership. The auth package receives these dependencies rather than accessing
request bindings at module initialization.

Better Auth with role-based authorization is the proposed implementation, not an
approved password/provider strategy. Workers Free CPU feasibility, login method,
moderator provisioning/bootstrap/recovery and the exact permission matrix remain
unresolved; see the [research findings](../research/moderator-auth-workers.md).
Moderation authorization must be enforced on the server. Public review submission
remains account-free and immediately published; this boundary does not introduce
a pre-publication approval queue.
