import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { optionalInt, optionalNumber } from '#lib/features/nutrition/server.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/meals/handler_plans.go — GET /app/nutrition/plans and
// POST /app/nutrition/plans (the default action).
export const load: PageServerLoad = async (event) => {
	event.depends('north:nutrition');
	const api = serverApi(event);
	const [plans, options] = await Promise.all([api.GET('/nutrition/plans'), api.GET('/nutrition/plan-options')]);
	return { plans: plans.data!.plans, options: options.data! };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const value = (name: string) => String(form.get(name) ?? '');
		const values = {
			name: value('name'),
			description: value('description'),
			mode: value('mode'),
			plan_type: value('plan_type'),
			custom_carb_pct: value('custom_carb_pct'),
			day_count: value('day_count'),
			weekdays: [] as number[]
		};
		// The form posts both the easy day count and the advanced weekdays; only
		// the chosen mode's field counts.
		let dayCount: number | undefined;
		if (values.mode === 'advanced') {
			for (const v of form.getAll('weekdays')) {
				const n = optionalInt(v);
				if (n !== undefined) values.weekdays.push(n);
			}
		} else {
			dayCount = optionalInt(values.day_count) ?? 0;
		}
		let planId: string;
		try {
			const { data } = await serverApi(event).POST('/nutrition/plans', {
				body: {
					name: values.name,
					description: values.description,
					// Open strings in Go; the service names an unknown one by field.
					mode: values.mode as 'easy',
					planType: values.plan_type as 'mid_carb',
					customCarbPct: optionalNumber(values.custom_carb_pct),
					dayCount,
					weekdays: values.mode === 'advanced' ? values.weekdays : undefined
				}
			});
			planId = data!.id;
		} catch (err) {
			if (isApiError(err) && err.status === 422 && Object.keys(err.fields).length > 0) {
				return fail(422, { values, errors: err.fields });
			}
			throw err;
		}
		redirect(303, `/app/nutrition/plans/${planId}`);
	}
};
