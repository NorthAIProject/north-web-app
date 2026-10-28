import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { goalErrors, goalFormFrom, goalRequest } from '#lib/features/goals/goals.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/goals/handler.go (GET /app/goals, POST /app/goals).
export const load: PageServerLoad = async (event) => {
	event.depends('north:goals');
	const { data } = await serverApi(event).GET('/goals');
	return { goals: data!.goals, overdueMilestones: data!.overdueMilestones ?? 0 };
};

export const actions: Actions = {
	create: async (event) => {
		const form = goalFormFrom(await event.request.formData());
		let id: string;
		try {
			const { data } = await serverApi(event).POST('/goals', { body: goalRequest(form) });
			id = data!.id;
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { errors: goalErrors(err.fields), values: form });
			}
			throw err;
		}
		redirect(303, `/app/goals/${id}`);
	}
};
