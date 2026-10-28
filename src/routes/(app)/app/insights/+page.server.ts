import { serverApi } from '#lib/server/api.js';
import { rangeQuery, readOr404 } from '#lib/features/insights/load.js';
import type { Awards } from '#lib/features/insights/summary/types.js';
import type { PageServerLoad } from './$types';

// Go: internal/insights/handler.go summary (GET /app/insights) and
// summaryPanels (GET /app/insights/panels — here the same load, re-run when
// the range link navigates client-side).
export const load: PageServerLoad = async (event) => {
	event.depends('north:insights');
	const api = serverApi(event);
	const [view, awards] = await Promise.all([
		readOr404(async () => (await api.GET('/insights', { params: { query: rangeQuery(event.url) } })).data!),
		awardsCard(api)
	]);
	return { view, awards };
};

/** The awards card is a bonus: if it cannot be read, the page still shows (Go awardsCard). */
async function awardsCard(api: ReturnType<typeof serverApi>): Promise<Awards | null> {
	try {
		return (await api.GET('/awards')).data ?? null;
	} catch {
		return null;
	}
}
