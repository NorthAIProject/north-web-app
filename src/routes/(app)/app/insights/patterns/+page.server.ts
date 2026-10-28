import { serverApi } from '#lib/server/api.js';
import { rangeQuery, readOr404 } from '#lib/features/insights/load.js';
import type { PageServerLoad } from './$types';

// Go: internal/insights/handler.go GET /app/insights/patterns (and /patterns/body, the
// fragment the range selector swapped: here the same load, re-run on a
// client-side navigation to ?range=).
export const load: PageServerLoad = async (event) => {
	event.depends('north:insights');
	const view = await readOr404(
		async () => (await serverApi(event).GET('/insights/patterns', { params: { query: rangeQuery(event.url) } })).data!
	);
	return { view };
};
