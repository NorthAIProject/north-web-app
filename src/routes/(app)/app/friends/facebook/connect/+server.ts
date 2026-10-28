import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { facebookCookiePath, facebookStateCookie } from '#lib/features/social/facebook.server.js';
import { serverApi } from '#lib/server/api.js';
import { secureCookies } from '#lib/server/config.js';
import type { RequestHandler } from './$types';

// Go: GET /app/friends/facebook/connect (Handler.facebookConnect). Starts the
// OAuth flow and keeps the state in a short-lived HttpOnly cookie.
export const GET: RequestHandler = async (event) => {
	if (!event.locals.session) redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
	let start;
	try {
		({ data: start } = await serverApi(event).POST('/social/facebook/web'));
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	}
	event.cookies.set(facebookStateCookie, start!.state, {
		path: facebookCookiePath,
		maxAge: start!.expiresIn,
		httpOnly: true,
		secure: secureCookies(event.url),
		sameSite: 'lax'
	});
	redirect(302, start!.url);
};
