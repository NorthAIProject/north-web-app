import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { inviteCookie, setLinkCookie } from '#lib/features/social/invite-cookies.server.js';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: GET /i/{code} (social Handler.invite). Shows who sent the link. A
// signed-in visitor is connected at once; a signed-out one carries the code in
// a cookie to wherever they sign up, and /app redeems it.
export const load: PageServerLoad = async (event) => {
	const api = serverApi(event);
	let preview;
	try {
		({ data: preview } = await api.GET('/invites/{code}', {
			params: { path: { code: event.params.code } }
		}));
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	}
	if (event.locals.session?.user) {
		await api.POST('/invites/{code}/redeem', { params: { path: { code: preview!.code } } });
		redirect(303, '/app/friends');
	}
	setLinkCookie(event.cookies, event.url, inviteCookie, preview!.code);
	return { inviter: preview!.inviter.displayName };
};
