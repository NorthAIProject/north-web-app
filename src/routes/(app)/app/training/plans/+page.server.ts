import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: internal/workouts/handler.go listPlans. Nothing to list means nothing
// has been built yet, which is the intake's job.
export const load: PageServerLoad = async (event) => {
	event.depends('north:training');
	const { data } = await serverApi(event).GET('/training/plans');
	const plans = data?.plans ?? [];
	if (plans.length === 0) redirect(303, '/app/training/new');
	return { plans };
};
