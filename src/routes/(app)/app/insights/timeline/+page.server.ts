import { serverApi } from '#lib/server/api.js';
import { rangeQuery, readOr404 } from '#lib/features/insights/load.js';
import type { PageServerLoad } from './$types';

// Go: internal/insights/handler.go timeline + timelineBody (GET
// /app/insights/timeline[/body]?range=&kind=).
export const load: PageServerLoad = async (event) => {
	event.depends('north:insights');
	const kind = event.url.searchParams.get('kind');
	const query = { ...rangeQuery(event.url), ...(kind ? { kind } : {}) };
	const view = await readOr404(async () => (await serverApi(event).GET('/insights/timeline', { params: { query } })).data!);
	// One clock for SSR and hydration, so "5 min ago" renders the same twice.
	return { view, now: Date.now() };
};
