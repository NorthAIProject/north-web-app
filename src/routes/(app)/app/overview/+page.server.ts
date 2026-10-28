import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { quotaRefusal } from '#lib/features/quota/quota.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// The command center (Go dashboard.Handler show/panels/today). A ?range= the
// API does not know is today, as in Go. The range selector is plain links, so
// switching period re-runs this load (Go swapped /app/overview/panels).
export const load: PageServerLoad = async (event) => {
	event.depends('north:overview');
	const range = event.url.searchParams.get('range') ?? '';
	const { data } = await serverApi(event).GET('/overview', { params: { query: range ? { range } : {} } });
	return { overview: data! };
};

// "Write today's briefing" (Go POST /app/reports/briefing, which returns to
// /app): queue it, then My Day, which shows it. Already generated this hour
// is ?notice=cooldown; a spent quota shows the refusal on the card.
export const actions: Actions = {
	briefing: async (event) => {
		try {
			await serverApi(event).POST('/reports/briefing');
		} catch (err) {
			if (isApiError(err) && err.status === 409) redirect(303, '/app?notice=cooldown');
			const quota = quotaRefusal(err);
			if (quota) return fail(429, { quota });
			throw err;
		}
		redirect(303, '/app');
	}
};
