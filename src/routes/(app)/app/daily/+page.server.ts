import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { anchor } from '#lib/features/dailyposts/dailyposts.js';
import type { Actions, PageServerLoad } from './$types';

// GET /app/daily (Go dailyposts.Handler.page): today's post, when there is
// one, and the ones before it.
export const load: PageServerLoad = async (event) => {
	const { data } = await serverApi(event).GET('/daily-posts');
	return { feed: data ?? { earlier: [] } };
};

// POST /app/daily/{id}/kudos and /kudos/undo (Go kudos(give)): both land back
// on the post they were given on.
async function kudos(event: Parameters<Actions[string]>[0], give: boolean) {
	const form = await event.request.formData();
	const postID = String(form.get('postID') ?? '');
	const api = serverApi(event);
	try {
		const params = { params: { path: { postID } } };
		if (give) await api.POST('/daily-posts/{postID}/kudos', params);
		else await api.DELETE('/daily-posts/{postID}/kudos', params);
	} catch (err) {
		if (isApiError(err) && (err.status === 404 || err.status === 422)) error(404, { message: 'The daily post could not be loaded.' });
		throw err;
	}
	redirect(303, `/app/daily#${anchor(postID)}`);
}

export const actions: Actions = {
	kudos: (event) => kudos(event, true),
	kudosUndo: (event) => kudos(event, false)
};
