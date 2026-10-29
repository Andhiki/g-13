# Keep curriculum data in a built workspace package

The Bun and Turborepo workspace builds `@g13/curriculum` with tsdown. The package owns each edition's source data, normalization, syllabi, academic rules, contracts, and synchronous curriculum queries; the web app owns scheduling and presentation. Consumers import JavaScript and declarations from `dist`, never package source, keeping dataset types behind a stable package boundary.

The build precomputes normalized curriculum records and emits shared course references without shipping raw audit data or adapters to the browser. Syllabi load on demand. This keeps curriculum metadata small at startup while leaving source evidence in the repository for review.
