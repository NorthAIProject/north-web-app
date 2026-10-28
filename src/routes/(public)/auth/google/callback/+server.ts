import { redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { googleRedirectUri, sameState, takeGoogleState } from '#lib/server/google.js';
import { safeNext } from '#lib/server/redirect.js';
import { writeSession } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

// GET /auth/google/callback (Go: auth.Handler.googleCallback). The URL Google
// returns to is unchanged, so the Google console needs no edit. Failures go
// back to /login with a reason; Go rendered the login page in place.
export const GET: RequestHandler = async (event) => {
	const { url, cookies } = event;
	const stored = takeGoogleState(cookies, url);

	if (url.searchParams.get('error')) redirect(303, '/login?google=denied');
	if (!stored) redirect(303, '/login?google=expired');
	if (!sameState(stored.state, url.searchParams.get('state') ?? '')) redirect(303, '/login?google=state');

	try {
		const { data } = await serverApi(event).POST('/auth/google/code', {
			body: { code: url.searchParams.get('code') ?? '', redirectUri: googleRedirectUri(url) }
		});
		writeSession(cookies, url, data!.token, data!.expiresAt);
	} catch (err) {
		if (isApiError(err) && err.status === 404) redirect(303, '/login?google=unavailable');
		redirect(303, '/login?google=failed');
	}
	redirect(303, safeNext(stored.next, '/app'));
};
