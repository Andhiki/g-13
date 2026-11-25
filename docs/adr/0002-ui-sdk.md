# Use ui-sdk primitives in the web app

Use `@ui-sdk/react` for shared interactive controls. Components in `apps/web/src/ui/` expose the app's variants and apply its Tailwind styles and design tokens. Keep presentational elements such as badges, breadcrumbs, key labels, and tables as semantic HTML where ui-sdk has no equivalent. Domain-specific layouts belong to their owning feature.

The design tokens and some styles still derive from the original starter. Their source and MIT license are recorded in [Third-Party Notices](../../THIRD_PARTY_NOTICES.md).
