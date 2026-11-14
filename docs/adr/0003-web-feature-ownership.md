# Keep page-specific behavior in web features

Each web feature owns its page composition, state, and domain-specific behavior. `apps/web/src/ui/` holds reusable design-system primitives; promote feature components there only when another feature needs them. This keeps page behavior close to its route and avoids abstractions for hypothetical consumers.

As a server-backed feature grows, keep its components, client query and mutation
options, server handlers and services, and shared schemas or pure logic in
separate feature-local layers. Add a layer only when it has a real
responsibility. See the [web feature structure guide](../web-feature-structure.md).
