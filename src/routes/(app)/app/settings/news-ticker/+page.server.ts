import { error, fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/news/handler.go (GET /app/settings/news-ticker and its posts).
// On a deployment without feeds the API answers 404 and so does this page,
// as Go never mounted the route there.
export const load: PageServerLoad = async (event) => {
	try {
		const { data } = await serverApi(event).GET('/news/settings');
		// Go: layout.BuildNav(ctx, "/app/settings").
		return { settings: data!, navActive: '/app/settings' };
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	}
};

const back = () => redirect(303, '/app/settings/news-ticker');

export const actions: Actions = {
	// Go: toggle. The switch posts "enabled" only when on.
	toggle: async (event) => {
		const form = await event.request.formData();
		const enabled = (form.get('enabled') ?? '') !== '';
		await serverApi(event).PUT('/news/settings', { body: { enabled } });
		back();
	},
	// Go: addFeed. A refused address comes back as fields.url with the typed value.
	add: async (event) => {
		const form = await event.request.formData();
		const url = String(form.get('url') ?? '').trim();
		try {
			await serverApi(event).POST('/news/feeds', { body: { url } });
		} catch (err) {
			if (isApiError(err) && (err.status === 422 || err.status === 400)) {
				return fail(422, { url, error: err.fields?.url ?? err.message });
			}
			throw err;
		}
		back();
	},
	// Go: removeFeed; a feed already gone counts as removed.
	remove: async (event) => {
		const form = await event.request.formData();
		const feedID = String(form.get('feed') ?? '');
		try {
			await serverApi(event).DELETE('/news/feeds/{feedID}', { params: { path: { feedID } } });
		} catch (err) {
			if (!(isApiError(err) && err.status === 404)) throw err;
		}
		back();
	}
};
