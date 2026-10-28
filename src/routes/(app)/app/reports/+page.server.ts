import { serverApi } from '#lib/server/api.js';
import { generate } from '#lib/features/reports/generate.server.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/reports/handler.go (GET /app/reports, POST /app/reports/generate).
export const load: PageServerLoad = async (event) => {
	event.depends('north:reports');
	const archived = event.url.searchParams.get('archived') === '1';
	const { data } = await serverApi(event).GET('/reports', {
		params: { query: archived ? { archived: true } : {} }
	});
	return { reports: data!.reports, archived, notice: event.url.searchParams.get('notice') ?? '' };
};

export const actions: Actions = {
	generate: (event) => generate(event)
};
