import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import {
	facebookCookiePath,
	facebookReturn,
	facebookStateCookie,
	sameState,
	type FacebookResult
} from '#lib/features/social/facebook.server.js';
import { serverApi } from '#lib/server/api.js';
import { secureCookies } from '#lib/server/config.js';
import type { RequestHandler } from './$types';

// Go: GET /app/friends/facebook/callback (Handler.facebookCallback). Connects
// the account and imports, then sends the browser back to the Friends page
// with how it went: connected, cancelled, expired, taken or failed.
export const GET: RequestHandler = async (event) => {
	const { cookies, url, locals } = event;
	if (!locals.session) redirect(303, `/login?next=${encodeURIComponent('/app/friends')}`);

	const api = serverApi(event);
	const { data: facebook } = await api.GET('/social/facebook');
	if (!facebook?.configured) error(404, 'Not found.');

	const state = cookies.get(facebookStateCookie) ?? '';
	cookies.delete(facebookStateCookie, { path: facebookCookiePath, secure: secureCookies(url) });

	const q = url.searchParams;
	let result: FacebookResult = 'connected';
	if (q.get('error')) {
		result = 'cancelled';
	} else if (!state || !sameState(state, q.get('state') ?? '')) {
		result = 'expired';
	} else {
		try {
			await api.POST('/social/facebook/web/callback', { body: { code: q.get('code') ?? '' } });
		} catch (err) {
			result = isApiError(err) && err.status === 409 ? 'taken' : 'failed';
			if (result === 'failed') console.error('facebook connect failed', err);
		}
	}
	redirect(303, facebookReturn(result));
};
