import { bindings, defineConfig } from "cf/config";
import { isolatedDatabaseId, isolatedHost, isolatedResourceName } from "../../e2e/targets.ts";

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
	const isE2E = mode === "staging-e2e";
	const workerName = isE2E ? isolatedResourceName : isStaging ? "g-13-staging" : "g-13";
	const database = isE2E
		? { name: isolatedResourceName, id: isolatedDatabaseId() }
		: isStaging
			? D1.staging
			: D1.production;

	return {
		worker: {
			name: workerName,
			compatibilityDate: "2026-10-19",
			compatibilityFlags: [
				"nodejs_compat",
			],
			entrypoint: "./src/worker.ts",
			triggers: isE2E
				? []
				: [
						{
							type: "scheduled",
							schedule: "0 3 * * *",
						},
					],
			cache: {
				enabled: !isE2E,
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
				ADMIN_EMAILS: isE2E ? bindings.text("") : bindings.secret(),
				BETTER_AUTH_ALLOWED_HOSTS: bindings.text(
					isE2E
						? isolatedHost
						: isStaging
							? "g-13-staging.andhikiandre.workers.dev"
							: "csugm.omahti.com,csugm.andhiki.tech",
				),
				GITHUB_CLIENT_ID: isE2E ? bindings.text("isolated-e2e-client") : bindings.secret(),
				GITHUB_CLIENT_SECRET: isE2E ? bindings.text("isolated-e2e-secret") : bindings.secret(),
				REVIEW_RATE_LIMIT_SECRET: bindings.secret(),
				TURNSTILE_SITE_KEY: isE2E ? bindings.text("isolated-e2e-site") : bindings.secret(),
				TURNSTILE_SECRET_KEY: isE2E ? bindings.text("isolated-e2e-verifier") : bindings.secret(),
			},
		},
	};
});
