import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { formFailure } from '#lib/server/form.js';
import type { Actions, PageServerLoad } from './$types';

// GET /app/onboarding (Go: onboarding.Handler.show). The /app layout already
// keeps an un-onboarded account here; a finished one has nothing to fill in.
export const load: PageServerLoad = async (event) => {
	if (event.locals.session?.user?.needsOnboarding === false) redirect(303, '/app');
	const { data } = await serverApi(event).GET('/onboarding');
	if (!data!.needsOnboarding) redirect(303, '/app');
	return { choices: data! };
};

export const actions: Actions = {
	// POST /app/onboarding (Go: complete) → /app/onboarding/done?thread=…
	// Named, because SvelteKit allows no default action beside named ones.
	complete: async (event) => {
		if (event.locals.session?.user?.needsOnboarding === false) redirect(303, '/app');
		const form = await event.request.formData();
		const values = {
			focus_areas: form.getAll('focus_areas').map(String),
			coaching_style_preset: String(form.get('coaching_style_preset') ?? 'direct'),
			coaching_style_custom: String(form.get('coaching_style_custom') ?? ''),
			goal_title: String(form.get('goal_title') ?? ''),
			first_week_template: String(form.get('first_week_template') ?? '')
		};
		let thread: string | undefined;
		try {
			const { data } = await serverApi(event).POST('/onboarding', {
				body: {
					focusAreas: values.focus_areas,
					coachingStyle: values.coaching_style_preset,
					coachingStyleCustom: values.coaching_style_custom,
					nearTermGoal: values.goal_title,
					firstWeekTemplate: values.first_week_template || undefined
				}
			});
			thread = data?.threadId;
		} catch (err) {
			return formFailure(err, values);
		}
		// The thread id travels in the query, as in Go: the done page is a GET
		// after a redirect and has nowhere else to learn it.
		redirect(303, thread ? `/app/onboarding/done?thread=${encodeURIComponent(thread)}` : '/app/onboarding/done');
	},

	// POST /app/onboarding/skip (Go: skip) → /app, ignoring every field.
	skip: async (event) => {
		await serverApi(event).POST('/onboarding/skip');
		redirect(303, '/app');
	}
};
