import { serverApi } from '#lib/server/api.js';
import { rangeQuery, readOr404 } from '#lib/features/insights/load.js';
import type { PageServerLoad } from './$types';

// Go: internal/insights/handler.go training + trainingBody (GET /app/insights/training and /training/body).
export const load: PageServerLoad = async (event) => {
	event.depends('north:insights');
	const view = await readOr404(
		async () => (await serverApi(event).GET('/insights/training', { params: { query: rangeQuery(event.url) } })).data!
	);
	// One clock for SSR and hydration: session times and the plan's "today".
	return { view, now: Date.now() };
};
