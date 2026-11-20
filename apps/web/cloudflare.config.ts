import { bindings, defineConfig } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .dev.vars.example. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

const D1 = {
	staging: {
		name: "g-13-staging",
		id: "5b5d43e1-399d-4844-b782-5ca632690089",
	},
	production: {
		name: "g-13",
		id: "4961475b-b620-4a57-8e09-520e8c17578b",
	},
};

export default defineConfig(({ mode }) => {
	const isStaging = mode === "staging";
	const workerName = isStaging ? "g-13-staging" : "g-13";
	const database = isStaging ? D1.staging : D1.production;

	return {
		worker: {
			name: workerName,
			compatibilityDate: "2026-10-19",
			compatibilityFlags: [
				"nodejs_compat",
			],
			entrypoint: "./src/worker.ts",
			triggers: [
				{
					type: "scheduled",
					schedule: "0 3 * * *",
				},
			],
			cache: {
				enabled: true,
			},
			observability: isStaging
				? {
						enabled: true,
						logs: {
							enabled: true,
							invocationLogs: true,
						},
					}
				: undefined,
			env: {
				ALUMNI: bindings.worker({
					worker: workerName,
				}),
				DB: bindings.d1({
					name: database.name,
					id: database.id,
				}),
				BETTER_AUTH_SECRET: bindings.secret(),
				BETTER_AUTH_URL: bindings.secret(),
				GITHUB_CLIENT_ID: bindings.secret(),
				GITHUB_CLIENT_SECRET: bindings.secret(),
				REVIEW_RATE_LIMIT_SECRET: bindings.secret(),
			},
		},
	};
});
