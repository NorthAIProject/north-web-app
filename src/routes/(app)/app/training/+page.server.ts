import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: internal/workouts/handler.go index. /app/training is the followed plan
// (the list puts it first), or the intake when nothing has been built yet.
export const load: PageServerLoad = async (event) => {
	const { data } = await serverApi(event).GET('/training/plans');
	const first = data?.plans[0];
	redirect(303, first ? `/app/training/${first.id}` : '/app/training/new');
};
