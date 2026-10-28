import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

// Go: POST /app/fitness/strava/disconnect. Imported sessions stay: they are a
// record of training that happened.
export const POST: RequestHandler = async (event) => {
	if (!event.locals.session) redirect(303, '/login?next=%2Fapp%2Ffitness');
	let notice = 'disconnected';
	try {
		await serverApi(event).DELETE('/fitness/strava');
	} catch {
		notice = 'disconnect-failed';
	}
	redirect(303, `/app/fitness?notice=${notice}`);
};
