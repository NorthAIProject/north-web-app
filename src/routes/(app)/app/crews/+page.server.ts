import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: crews.Handler.index / create (GET, POST /app/crews).
export const load: PageServerLoad = async (event) => {
	event.depends('north:crews');
	const { data } = await serverApi(event).GET('/crews');
	return { mine: data!.crews };
};

export const actions: Actions = {
	default: async (event) => {
		const name = String((await event.request.formData()).get('name') ?? '');
		let id: string;
		try {
			const { data } = await serverApi(event).POST('/crews', { body: { name } });
			id = data!.id;
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { errors: err.fields, values: { name } });
			}
			throw err;
		}
		redirect(303, `/app/crews/${id}`);
	}
};
