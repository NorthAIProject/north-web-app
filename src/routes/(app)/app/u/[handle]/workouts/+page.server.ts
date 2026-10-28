import { serverApi } from '#lib/server/api.js';
import { orNotFound } from '#lib/features/profiles/load.js';
import type { PageServerLoad } from './$types';

// Go: internal/profiles/handler.go workouts (GET /app/u/{handle}/workouts?before=).
export const load: PageServerLoad = async (event) => {
	const handle = event.params.handle;
	const before = event.url.searchParams.get('before') ?? undefined;
	const api = serverApi(event);
	const [page, profile] = await Promise.all([
		orNotFound(api.GET('/profiles/{handle}/workouts', { params: { path: { handle }, query: { before } } })),
		orNotFound(api.GET('/profiles/{handle}', { params: { path: { handle } } }))
	]);
	const next = page.data!.before;
	return {
		page: page.data!,
		profile: profile.data!,
		more: next ? `?before=${encodeURIComponent(next)}` : ''
	};
};
