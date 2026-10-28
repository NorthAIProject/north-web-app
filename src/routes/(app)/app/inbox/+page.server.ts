import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { activeGoalsForFiling, filingFrom } from '#lib/features/inbox/inbox.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// The inbox (Go inbox.Handler): what is waiting to be filed, and the active
// goals a note can be filed under.
export const load: PageServerLoad = async (event) => {
	event.depends('north:inbox');
	const api = serverApi(event);
	const [inbox, goals] = await Promise.all([api.GET('/inbox'), api.GET('/goals')]);
	return { inbox: inbox.data!, goals: activeGoalsForFiling(goals.data?.goals ?? []) };
};

// Go POST /app/inbox, /app/inbox/{id}/file and /app/inbox/{id}/dismiss, as
// named actions on the page (the item id rides in the form). Each returns to
// the inbox; a refused capture keeps its text and shows the message.
export const actions: Actions = {
	add: async (event) => {
		const text = String((await event.request.formData()).get('text') ?? '');
		try {
			await serverApi(event).POST('/inbox', { body: { text, source: 'web' } });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { text, error: err.fields.text ?? err.message });
			}
			throw err;
		}
		redirect(303, '/app/inbox');
	},
	file: async (event) => {
		const form = await event.request.formData();
		const itemID = String(form.get('item') ?? '');
		await serverApi(event).POST('/inbox/{itemID}/file', { params: { path: { itemID } }, body: filingFrom(form) });
		redirect(303, '/app/inbox');
	},
	dismiss: async (event) => {
		const itemID = String((await event.request.formData()).get('item') ?? '');
		await serverApi(event).POST('/inbox/{itemID}/dismiss', { params: { path: { itemID } } });
		redirect(303, '/app/inbox');
	}
};
