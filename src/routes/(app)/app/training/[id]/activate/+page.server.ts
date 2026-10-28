import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: week_handler.go activatePlan. POST only; a GET lands back on the plan.
export const load: PageServerLoad = ({ params }) => redirect(303, `/app/training/${params.id}`);

export const actions: Actions = {
	default: async (event) => {
		const { data } = await serverApi(event).POST('/training/plans/{planID}/activate', {
			params: { path: { planID: event.params.id } }
		});
		redirect(303, `/app/training/${data!.id}`);
	}
};
