import { redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

// Go: POST /app/fitness/strava/sync — queue a sync, then the hub with a notice.
export const POST: RequestHandler = async (event) => {
	if (!event.locals.session) redirect(303, '/login?next=%2Fapp%2Ffitness');
	let notice = 'syncing';
	try {
		await serverApi(event).POST('/fitness/strava/sync');
	} catch (err) {
		notice = isApiError(err) && err.status === 404 ? 'sync-first' : 'sync-failed';
	}
	redirect(303, `/app/fitness?notice=${notice}`);
};
