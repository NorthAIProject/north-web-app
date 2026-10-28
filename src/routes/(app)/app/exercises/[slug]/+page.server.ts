import { error } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import type { Api } from '#lib/api/client.js';
import { serverApi } from '#lib/server/api.js';
import { SIMILAR_LIMIT, type PlanDayOption } from '#lib/features/exercises/vocabulary.js';
import type { PageServerLoad } from './$types';

// Go: internal/exercises/handler.go detail (GET /app/exercises/{slug}).
export const load: PageServerLoad = async (event) => {
	const api = serverApi(event);
	let exercise;
	try {
		({ data: exercise } = await api.GET('/exercises/{slug}', { params: { path: { slug: event.params.slug } } }));
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found');
		throw err;
	}
	const e = exercise!;
	const [plan, similar] = await Promise.all([planDays(api, e.slug), similarTo(api, e.slug, e.primaryMuscles[0])]);
	return { exercise: e, planId: plan.id, days: plan.days, similar };
};

/**
 * The reader's current plan day by day, marking days that already include
 * this exercise. No plan is the page's "build a plan" case (Go: planDays).
 */
async function planDays(api: Api, slug: string): Promise<{ id: string; days: PlanDayOption[] }> {
	const { data: list } = await api.GET('/training/plans');
	const active = list!.plans[0];
	if (!active) return { id: '', days: [] };
	const { data: plan } = await api.GET('/training/plans/{planID}', { params: { path: { planID: active.id } } });
	return {
		id: plan!.id,
		days: plan!.days.map((day, index) => ({
			index,
			weekday: day.weekday,
			focus: day.focus,
			includes: day.exercises.some((ex) => ex.catalogSlug === slug)
		}))
	};
}

/** Other movements for the same main muscle (Go: similar). */
async function similarTo(api: Api, slug: string, muscle: string | undefined) {
	if (!muscle) return [];
	const { data } = await api.GET('/exercises', { params: { query: { muscle, limit: SIMILAR_LIMIT + 1 } } });
	return data!.exercises.filter((c) => c.slug !== slug).slice(0, SIMILAR_LIMIT);
}
