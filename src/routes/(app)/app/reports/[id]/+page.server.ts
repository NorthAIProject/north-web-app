import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { regenerate } from '#lib/features/reports/generate.server.js';
import { parseHelpful } from '#lib/features/reports/reports.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/reports/handler.go (GET /app/reports/{id}, POST archive,
// regenerate and helpful).
export const load: PageServerLoad = async (event) => {
	event.depends('north:report');
	try {
		const { data } = await serverApi(event).GET('/reports/{reportID}', {
			params: { path: { reportID: event.params.id } }
		});
		return { report: data!, notice: event.url.searchParams.get('notice') ?? '' };
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	}
};

export const actions: Actions = {
	archive: async (event) => {
		await serverApi(event).POST('/reports/{reportID}/archive', { params: { path: { reportID: event.params.id } } });
		redirect(303, '/app/reports');
	},
	regenerate: (event) => regenerate(event, event.params.id),
	helpful: async (event) => {
		const helpful = parseHelpful(String((await event.request.formData()).get('answer') ?? ''));
		if (helpful === undefined) error(404, 'Not found.');
		await serverApi(event).PUT('/reports/{reportID}/helpful', {
			params: { path: { reportID: event.params.id } },
			body: { helpful }
		});
		// With JavaScript the page updates in place (Go swapped the rating in);
		// without, this lands back on the report as Go's redirect did.
		return { rated: true };
	}
};
