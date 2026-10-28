import { serverApi } from '#lib/server/api.js';
import { rangeQuery, readOr404 } from '#lib/features/insights/load.js';
import type { PageServerLoad } from './$types';

// Go: internal/insights/handler.go GET /app/insights/metric/{key} (and its
// /body fragment). An unknown key is the API's 404, and the page's.
export const load: PageServerLoad = async (event) => {
	event.depends('north:insights');
	const key = event.params.key;
	const view = await readOr404(
		async () =>
			(
				await serverApi(event).GET('/insights/metrics/{key}', {
					params: { path: { key }, query: rangeQuery(event.url) }
				})
			).data!
	);
	return { view };
};
