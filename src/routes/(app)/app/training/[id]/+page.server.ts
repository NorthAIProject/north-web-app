import { error } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { todayIn } from '#lib/features/training/weekday.js';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: internal/workouts/handler.go showPlan + planView. The followed plan's
// page carries the week; any other plan's page offers to follow it instead.
export const load: PageServerLoad = async (event) => {
	event.depends('north:training');
	const api = serverApi(event);
	const planID = event.params.id;

	const [plan, plans, overview] = await Promise.all([
		api
			.GET('/training/plans/{planID}', { params: { path: { planID } } })
			.then((r) => r.data!)
			.catch((err) => {
				if (isApiError(err) && err.status === 404) error(404, 'Not found.');
				throw err;
			}),
		api.GET('/training/plans').then((r) => r.data!.plans),
		api.GET('/training/overview').then((r) => r.data!)
	]);
	const week = plan.active ? (await api.GET('/training/week')).data! : null;

	const { parent } = event;
	const { user } = await parent();
	return { plan, plans, overview, week, todayWeekday: todayIn(user.timezone) };
};
