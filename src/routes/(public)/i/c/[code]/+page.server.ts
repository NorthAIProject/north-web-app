import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { crewCookie, setLinkCookie } from '#lib/features/social/invite-cookies.server.js';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: GET /i/c/{code} (crews Handler.joinLink). A signed-in visitor joins at
// once and lands in the crew; a signed-out one carries the code in a cookie to
// wherever they sign up, and /app joins them.
export const load: PageServerLoad = async (event) => {
	const api = serverApi(event);
	const notFound = (err: unknown): never => {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	};
	const { data: crew } = await api
		.GET('/crews/join/{code}', { params: { path: { code: event.params.code } } })
		.catch(notFound);
	const code = event.params.code;
	if (event.locals.session?.user) {
		const { data: joined } = await api
			.POST('/crews/join/{code}', { params: { path: { code } } })
			.catch(notFound);
		redirect(303, '/app/crews/' + joined!.id);
	}
	setLinkCookie(event.cookies, event.url, crewCookie, code);
	return { name: crew!.name, members: crew!.memberCount };
};
