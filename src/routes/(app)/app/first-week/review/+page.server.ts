import { redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: GET /app/first-week/review — the day-7 review. Opening it finishes the
// week (POST /first-week/finish); before day 7, or for a week that has none,
// it is back to My Day.
export const load: PageServerLoad = async (event) => {
	try {
		const { data } = await serverApi(event).POST('/first-week/finish');
		return { week: data! };
	} catch (err) {
		if (isApiError(err) && (err.status === 409 || err.status === 404)) redirect(303, '/app');
		throw err;
	}
};
