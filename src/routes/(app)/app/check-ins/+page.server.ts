import { fail } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { formErrors, formFromData, requestFrom } from '#lib/features/checkins/checkins.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/checkins/handler.go (GET/POST /app/check-ins, GET /live).
export const load: PageServerLoad = async (event) => {
	event.depends('north:checkins');
	const api = serverApi(event);
	const [{ data: list }, { data: goals }] = await Promise.all([api.GET('/check-ins'), api.GET('/goals')]);
	return {
		list: list!,
		activeGoals: goals!.goals.filter((g) => g.status === 'active').map((g) => ({ id: g.id, title: g.title }))
	};
};

export const actions: Actions = {
	// One check-in a day: saving again replaces today's (Go upsert).
	save: async (event) => {
		const form = formFromData(await event.request.formData());
		try {
			const { data } = await serverApi(event).PUT('/check-ins/today', { body: requestFrom(form) });
			return { saved: data! };
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { errors: formErrors(err.fields), values: form });
			}
			throw err;
		}
	}
};
