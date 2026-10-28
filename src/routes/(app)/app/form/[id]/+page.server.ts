import { error } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: internal/media/handler.go show (GET /app/form/{id}). The analysis and the
// clip's signed playback URL come from one API call.
export const load: PageServerLoad = async (event) => {
	event.depends('north:formcheck');
	try {
		const { data } = await serverApi(event).GET('/form-checks/{analysisID}', {
			params: { path: { analysisID: event.params.id } }
		});
		return { check: data! };
	} catch (err) {
		// Go answers "Not found." for a malformed id as well as someone else's.
		if (isApiError(err) && (err.status === 404 || err.status === 400 || err.status === 422)) error(404, 'Not found.');
		throw err;
	}
};
