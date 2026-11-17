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

GitHub OAuth is the selected login method; local password authentication is out
of scope. New sign-ins receive only the default `user` role, and only an admin
may assign privileged roles. Better Auth implements the selected policy. Workers
CPU feasibility and owner-approved first-admin bootstrap, recovery and
offboarding remain unresolved; see the
[research findings](../research/moderator-auth-workers.md).
Moderation authorization must be enforced on the server. Public review submission
remains account-free and immediately published; this boundary does not introduce
a pre-publication approval queue.
