import { bindings, defineConfig } from "cf/config";
import {
	localOrigin,
	localE2eResourceName,
	localE2eDatabaseId,
} from "../../e2e/local-worker.ts";

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
	const isE2E = mode === "local-e2e";
	const e2eOrigin = isE2E ? localOrigin(process.env.E2E_BASE_URL) : undefined;
	const workerName = isE2E ? localE2eResourceName : isStaging ? "g-13-staging" : "g-13";
	const database = isE2E
		? { name: localE2eResourceName, id: localE2eDatabaseId }
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
			// cf deploy disables these when omitted, so keep the existing URLs alive.
			workersDev: !isE2E,
			previewUrls: !isE2E,
			observability: isE2E
				? undefined
				: {
						logs: {
							enabled: true,
							headSamplingRate: 1,
							invocationLogs: true,
							persist: true,
						},
						traces: {
							enabled: true,
							headSamplingRate: 1,
							persist: true,
						},
						issues: {
							enabled: true,
						},
					},
			env: {
				ALUMNI: bindings.worker({
					worker: workerName,
				}),
				DB: bindings.d1({
					name: database.name,
					id: database.id,
				}),
				E2E_FIXTURE_TOKEN: isE2E
					? bindings.text(requiredE2eSecret("E2E_FIXTURE_TOKEN"))
					: undefined,
				BETTER_AUTH_SECRET: isE2E
					? bindings.text(requiredE2eSecret("E2E_AUTH_SECRET"))
					: bindings.secret(),
				BETTER_AUTH_URL: e2eOrigin ? bindings.text(e2eOrigin) : bindings.secret(),
				ADMIN_EMAILS: isE2E ? bindings.text("") : bindings.secret(),
				BETTER_AUTH_ALLOWED_HOSTS: bindings.text(
					e2eOrigin
						? new URL(e2eOrigin).hostname
						: isStaging
							? "stg.csugm.andhiki.tech,g-13-staging.andhikiandre.workers.dev"
							: "csugm.omahti.com,csugm.andhiki.tech",
				),
				GITHUB_CLIENT_ID: isE2E ? bindings.text("isolated-e2e-client") : bindings.secret(),
				GITHUB_CLIENT_SECRET: isE2E ? bindings.text("isolated-e2e-secret") : bindings.secret(),
				REVIEW_RATE_LIMIT_SECRET: isE2E
					? bindings.text(requiredE2eSecret("E2E_REVIEW_RATE_LIMIT_SECRET"))
					: bindings.secret(),
				TURNSTILE_SITE_KEY: isE2E ? bindings.text("isolated-e2e-site") : bindings.secret(),
				TURNSTILE_SECRET_KEY: isE2E ? bindings.text("isolated-e2e-verifier") : bindings.secret(),
				OPENAI_API_KEY: isE2E ? bindings.text("") : bindings.secret(),
			},
		},
	};
});

function requiredE2eSecret(name: string) {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is required for local E2E mode`);
	return value;
}
