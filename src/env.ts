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
