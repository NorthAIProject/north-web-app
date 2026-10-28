import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

// Go: GET /app/fitness/strava/connect. The browser leaves for Strava's consent
// page from here; Strava returns to this app's ./callback. The state is kept
// by the API against this person, so no cookie is needed here.
export const GET: RequestHandler = async (event) => {
	if (!event.locals.session) redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
	const callbackUrl = new URL('/app/fitness/strava/callback', event.url.origin).toString();
	let authorizeUrl: string;
	try {
		const { data } = await serverApi(event).POST('/fitness/strava/connect/web', {
			body: { callbackUrl }
		});
		authorizeUrl = data!.authorizeUrl;
	} catch (err) {
		// Unconfigured: Go answered 404 here too.
		if (isApiError(err) && err.status === 404) error(404, { message: 'Not found.' });
		throw err;
	}
	redirect(302, authorizeUrl);
};
