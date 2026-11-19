import { bindings, defineConfig } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .dev.vars.example. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

export default defineConfig({
	worker: {
		name: "g-13",
		compatibilityDate: "2026-10-19",
		compatibilityFlags: [
			"nodejs_compat",
		],
		entrypoint: "@tanstack/react-start/server-entry",
		cache: {
			enabled: true,
		},
		env: {
			ALUMNI: bindings.worker({
				worker: "g-13",
			}),
			DB: bindings.d1({
				name: "lecturer-reviews",
				id: "00000000-0000-4000-8000-000000000001",
			}),
		},
	},
});
