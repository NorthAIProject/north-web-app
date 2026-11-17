import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';
import { formText } from '#lib/forms.js';

// Go: internal/mind/handler.go (GET /app/mind, POST /app/mind/journal).
// The instruments come from the check-ins (Go loadInstruments →
// RecentForContext), computed by the page from the recent list.
export const load: PageServerLoad = async (event) => {
	event.depends('north:mind');
	const api = serverApi(event);
	const [{ data: journal }, { data: checkIns }] = await Promise.all([
		api.GET('/mind/journal'),
		api.GET('/check-ins')
	]);
	return { entries: journal!.entries, recent: checkIns!.recent };
};

export const actions: Actions = {
	journal: async (event) => {
		const form = await event.request.formData();
		const content = formText(form, 'content');
		const raw = formText(form, 'mood').trim();
		const mood = /^[+-]?\d+$/.test(raw) ? Number(raw) : undefined;
		try {
			await serverApi(event).POST('/mind/journal', { body: { content, mood } });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { errors: err.fields, values: { content, mood: mood ?? null } });
			}
			throw err;
		}
		redirect(303, '/app/mind');
	}
};
