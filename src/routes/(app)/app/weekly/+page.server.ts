import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { goalOrder, MAX_PRIORITIES, type Volume } from '#lib/features/weekly/form.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/weekly/handler.go (GET/POST /app/weekly).
export const load: PageServerLoad = async (event) => {
	event.depends('north:weekly');
	const { data } = await serverApi(event).GET('/weekly/review');
	return { review: data!, saved: event.url.searchParams.get('saved') === '1' };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const priorities = form.getAll('priority').map(String).slice(0, MAX_PRIORITIES);
		const volume = String(form.get('volume') ?? '') as Volume;
		const order = goalOrder(form);
		try {
			await serverApi(event).PUT('/weekly/focus', {
				body: { priorities, goalOrder: order, volume }
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { errors: err.fields, values: { priorities, volume } });
			}
			throw err;
		}
		redirect(303, '/app/weekly?saved=1');
	}
};
