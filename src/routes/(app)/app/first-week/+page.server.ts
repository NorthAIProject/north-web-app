import { redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: GET /app/first-week was the card as an htmx fragment, loaded into My Day
// and the dashboard; here it is FirstWeekCard, fed by those pages' loads. The
// route stays for the card's no-JavaScript Done form (Go: POST
// /app/first-week/done), which lands back on My Day.
export const load: PageServerLoad = () => redirect(303, '/app');

export const actions: Actions = {
	done: async (event) => {
		try {
			await serverApi(event).POST('/first-week/done');
		} catch (err) {
			// A stale card (the week ended, or the day is over) just shows what is true now.
			if (!isApiError(err) || (err.status !== 409 && err.status !== 404)) throw err;
		}
		redirect(303, '/app');
	}
};
