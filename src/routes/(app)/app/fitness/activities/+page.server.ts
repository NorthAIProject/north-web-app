import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: internal/fitness/handler.go activities (GET /app/fitness/activities).
// ?page= is read the Go way: anything that is not a positive number is page one.
export const load: PageServerLoad = async (event) => {
	event.depends('north:fitness');
	const n = Number.parseInt(event.url.searchParams.get('page') ?? '', 10);
	const page = Number.isFinite(n) && n >= 1 ? n : 1;
	const { data } = await serverApi(event).GET('/fitness/activities', {
		params: { query: { page } }
	});
	return { activities: data! };
};
