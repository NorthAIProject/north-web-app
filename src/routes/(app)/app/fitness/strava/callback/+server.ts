import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

// Go: GET /app/fitness/strava/callback. Strava returns here with state and
// code; the API checks the state was issued to this person and exchanges the
// code (the client secret never leaves Go). The hub then says what happened.
export const GET: RequestHandler = async (event) => {
	const { url } = event;
	if (!event.locals.session)
		redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	if (url.searchParams.get('error')) redirect(303, '/app/fitness?notice=cancelled');

	const { data } = await serverApi(event).POST('/fitness/strava/connect/web/finish', {
		body: { state: url.searchParams.get('state') ?? '', code: url.searchParams.get('code') ?? '' }
	});
	redirect(303, `/app/fitness?notice=${encodeURIComponent(data?.result ?? 'failed')}`);
};
