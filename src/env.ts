import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	NORTH_API_URL: {
		description:
			"north-client's JSON API as this server sees it. Locally the Go process on :8090; in production the cluster's khepri-web.",
		schema: (value) => (value || 'http://localhost:8090/api/v1').replace(/\/$/, '')
	},
	// On Cloudflare the Worker answers for the whole host; requests for the paths
	// Go keeps (src/lib/server/edge.ts) are passed to this origin. Empty = no
	// passthrough, which is right for local dev where Go has its own port.
	GO_ORIGIN: {
		description: 'Origin that serves the Go-owned paths (/api/v1, /mcp, /oauth/token, …). Empty disables the passthrough.',
		schema: (value) => (value ?? '').trim().replace(/\/$/, '')
	},
	// PostHog (north-client web/shared/analytics). Same names as the Go
	// deployment's env, so the cluster secret carries over unchanged. Empty key
	// = no snippet, no script, nothing reported.
	POSTHOG_API_KEY: {
		public: true,
		description: "PostHog project key (phc_…). Public by design; unset turns the browser analytics off.",
		schema: (value) => (value ?? '').trim()
	},
	POSTHOG_HOST: {
		public: true,
		description: 'PostHog ingestion host the browser reports to.',
		schema: (value) => (value || 'https://eu.i.posthog.com').trim().replace(/\/$/, '')
	},
	// The 3D emblem experiment (ADR 0005). Set only on the beta Worker
	// (wrangler.jsonc env.beta); empty everywhere else, which keeps the flat
	// emblem and never loads three.js or the model. Same-origin paths only.
	// Read by the root layout's server load (not imported by client code, so
	// the public env chunk is unchanged for every route).
	EMBLEM_3D_MODEL_URL: {
		description: 'Path of the 3D emblem model (/assets/models/emblem-<hash>.glb). Empty turns the 3D emblem off.',
		schema: (value) => {
			const url = (value ?? '').trim();
			return /^\/assets\/models\/[\w.-]+\.glb$/.test(url) ? url : '';
		}
	},
	// The 3D mascot experiment (ADR 0006). Set only on the beta Worker, like
	// EMBLEM_3D_MODEL_URL, and read only by /app/onboarding's server load.
	MASCOT_3D_MODEL_URL: {
		description: 'Path of the 3D mascot model (/assets/models/mascot-<hash>.glb). Empty turns the 3D mascot off.',
		schema: (value) => {
			const url = (value ?? '').trim();
			return /^\/assets\/models\/[\w.-]+\.glb$/.test(url) ? url : '';
		}
	},
	// /.well-known/apple-app-site-association (north-client internal/auth/aasa.go).
	// Defaults are the production values from the infra repo's khepri web values.
	APPLE_TEAM_ID: {
		description: 'Apple developer team ID that prefixes each app ID in the AASA file. Set to an empty string to serve 404.',
		schema: (value) => (value ?? '84X9WYBF36').trim()
	},
	APPLE_BUNDLE_ID: {
		description: 'Comma-separated iOS bundle IDs (App Store, then TestFlight) for webcredentials and invite universal links.',
		schema: (value) => (value ?? 'com.fernandocorreia.khepri,com.fernandocorreia.khepri.beta').trim()
	}
});
