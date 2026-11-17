# Keep page-specific behavior in web features

Each web feature owns its page composition, state, and domain-specific behavior. `apps/web/src/ui/` holds reusable design-system primitives; promote feature components there only when another feature needs them. This keeps page behavior close to its route and avoids abstractions for hypothetical consumers.
