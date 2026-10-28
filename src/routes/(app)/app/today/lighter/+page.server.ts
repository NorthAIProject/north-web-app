import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: GET /app/today/lighter was the lighter-day offer as an htmx fragment,
// loaded into the dashboard; here it is LighterDayCard, which reads GET
// /today/lighter itself. The route stays for the card's no-JavaScript form
// (Go: POST /app/today/lighter), which lands back on My Day like Go's did.
export const load: PageServerLoad = () => redirect(303, '/app');

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const choice = form.get('choice') === 'lighter' ? 'lighter' : 'keep';
		try {
			await serverApi(event).PUT('/today/lighter', { body: { choice } });
		} catch (err) {
			if (isApiError(err) && err.status === 422) return fail(422, { error: 'day.log.invalid' });
			throw err;
		}
		redirect(303, '/app');
	}
};
