# Built curriculum package in a Bun and Turborepo workspace

Move the web app to `apps/web` and retain Bun, with Turborepo coordinating workspace tasks. A shared curriculum package owns datasets, normalization, and a synchronous, type-safe data access layer for browser and server consumers. It provides curriculum, course, syllabus, and prerequisite queries; rendering and roadmap planning remain in the web app. This boundary replaces direct application imports of raw datasets without introducing a database or HTTP service.

Build shared packages with tsdown. Development and production consumers must resolve JavaScript and declarations from built output, with no source aliases or declaration maps leading back into package source. This deliberately adds a package build step to keep deeply nested dataset types out of consumers' TypeScript language-server work.

Organize the shared package by curriculum feature slices: each curriculum owns its dataset, normalization, syllabi, and tests under `src/curricula/<id>/`. Shared contracts and a registry connect these slices to the public DAL. Curriculum IDs derive from the registry so adding or removing editions does not require maintaining a separate ID union. Keep curriculum exploration and roadmap planning as web feature slices.

Prefer explicit public domain contracts and query return types over inferred dataset shapes; inference remains acceptable where it stays manageable behind the built package boundary. Course IDs remain strings, and missing course lookups return `undefined`.

Curriculum slices also own curriculum-specific academic rules and capabilities, exposed through typed contracts. The web app retains the planning algorithm, quiz presentation, and rendering. Selectors and URL validation use the registry, which defines one explicit default curriculum, rather than assuming a fixed pair of editions or treating future editions as 2026.

Each slice physically owns the JSON it ships. Keep source PDFs and audit evidence at repository level. Retire document-specific extraction scripts and their parser tests; preserve source/data validation tests and document the output contracts and import process in `docs/curriculum-import.md`, since PDF layouts change between editions.
