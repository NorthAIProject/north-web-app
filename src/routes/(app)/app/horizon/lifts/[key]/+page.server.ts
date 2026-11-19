import { error } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// One lift's forecast with the history behind it. The key is the lift's own,
// from GET /horizon: its catalog slug, or its name in lower case.
export const load: PageServerLoad = async (event) => {
	try {
		const { data } = await serverApi(event).GET('/horizon/lifts/{key}', {
			params: { path: { key: event.params.key } }
		});
		return { lift: data! };
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'That lift has no history.');
		throw err;
	}
};
