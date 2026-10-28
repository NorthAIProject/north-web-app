import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { googleRedirectUri, writeGoogleState } from '#lib/server/google.js';
import { safeNext } from '#lib/server/redirect.js';
import type { RequestHandler } from './$types';

// GET /auth/google (Go: auth.Handler.googleStart): ask north-client for the
// consent URL, keep the state in a short-lived HttpOnly cookie, send the
// browser to Google.
export const GET: RequestHandler = async (event) => {
	const { url, locals, cookies } = event;
	if (locals.session?.user) redirect(303, '/app');

	let start;
	try {
		({ data: start } = await serverApi(event).POST('/auth/google/start', {
			body: { redirectUri: googleRedirectUri(url) }
		}));
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found');
		redirect(303, '/login?google=unavailable');
	}

	const next = safeNext(url.searchParams.get('next'), '');
	writeGoogleState(cookies, url, start!.state, next);
	// Google's consent page, built by north-client.
	redirect(302, start!.url, { external: true });
};
