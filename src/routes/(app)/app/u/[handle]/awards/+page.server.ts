import { serverApi } from '#lib/server/api.js';
import { orNotFound } from '#lib/features/profiles/load.js';
import type { PageServerLoad } from './$types';

// Go: internal/awards/handler.go profile (GET /app/u/{handle}/awards).
export const load: PageServerLoad = async (event) => {
	const handle = event.params.handle;
	const { data } = await orNotFound(
		serverApi(event).GET('/profiles/{handle}/awards', { params: { path: { handle } } })
	);
	return { person: data! };
};
