import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { formFrom, inputFrom } from '#lib/features/decisions/form.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/decisions/handler.go — GET and POST /app/decisions.
export const load: PageServerLoad = async (event) => {
	event.depends('north:decisions');
	const { data } = await serverApi(event).GET('/decisions');
	// The Go page lists the newest 50; the API returns up to 100.
	return { decisions: data!.decisions.slice(0, 50) };
};

export const actions: Actions = {
	default: async (event) => {
		const form = formFrom(await event.request.formData());
		try {
			await serverApi(event).POST('/decisions', { body: inputFrom(form) });
		} catch (err) {
			if (isApiError(err) && err.status === 422) return fail(422, { ...form, errors: err.fields });
			throw err;
		}
		redirect(303, '/app/decisions');
	}
};
