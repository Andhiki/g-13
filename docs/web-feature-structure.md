# Structure for server-backed web features

Use this structure as a server-backed feature grows. Create a layer when it has a
real responsibility; do not add empty folders or modules just to match the
template, and do not reorganize unrelated features preemptively.

```text
features/<feature>/
  components/   Feature React components (`.tsx`)
  client/       Query and mutation options used by routes and components
  server/       Server handlers, repositories, and business-rule services
  shared/       Schemas, user-facing validation errors, and pure feature logic
```

- Keep query options in `client/queries.ts` so route loaders can prefetch them
  and components can use the same options.
- Keep SQL and persistence details in repositories. Services own business rules
  and result composition; add a service only when that behavior exists.
- Keep server-only imports out of `client/` and `shared/`. A server handler may
  use static imports for server-only modules when every reference to them stays
  inside `createServerFn(...).handler(...)` bodies. Import `createServerFn` from
  `@tanstack/react-start`; keep request access, environment binding use, database
  creation and queries, and secret parsing inside handler execution. Do not do
  request-dependent I/O or read runtime bindings at module initialization.
- Do not add barrel re-exports or compatibility aliases for moved modules.
- Put app-wide request identity policy, including Cloudflare-specific header
  handling, in `apps/web/src/server/` rather than a generic utility package or a
  single feature.

This structure extends the page-specific ownership decision in
[ADR 0003](adr/0003-web-feature-ownership.md).
