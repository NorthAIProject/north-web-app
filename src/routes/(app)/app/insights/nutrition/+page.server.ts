import { serverApi } from '#lib/server/api.js';
import { rangeQuery, readOr404 } from '#lib/features/insights/load.js';
import type { PageServerLoad } from './$types';

// Go: internal/insights/handler.go nutrition + nutritionBody (GET /app/insights/nutrition and /nutrition/body).
export const load: PageServerLoad = async (event) => {
	event.depends('north:insights');
	const view = await readOr404(
		async () => (await serverApi(event).GET('/insights/nutrition', { params: { query: rangeQuery(event.url) } })).data!
	);
	return { view };
};
