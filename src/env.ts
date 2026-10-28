import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	NORTH_API_URL: {
		description:
			"north-client's JSON API as this server sees it. Locally the Go process on :8090; in production the cluster's khepri-web.",
		schema: (value) => (value || 'http://localhost:8090/api/v1').replace(/\/$/, '')
	}
});
