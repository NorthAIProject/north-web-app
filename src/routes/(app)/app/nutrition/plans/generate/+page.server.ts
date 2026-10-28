import { serverApi } from '#lib/server/api.js';
import { generate, type GenerateForm } from '#lib/features/planimport/server.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/planimport/generate_handler.go — GET/POST
// /app/nutrition/plans/generate. The form starts from the person's last
// answers; a drafted plan is reviewed and saved exactly as an import.
export const load: PageServerLoad = async (event) => {
	const form: GenerateForm = { objective: 'maintenance', days: 3, mealsPerDay: 4, planType: 'mid_carb', exclusions: [], notes: '' };
	let hasTarget = true;
	try {
		const { data } = await serverApi(event).GET('/nutrition/plans/intake');
		hasTarget = data!.hasTarget;
		if (data!.intake) Object.assign(form, data!.intake);
	} catch {
		// Go logs and shows the defaults rather than failing the page.
	}
	form.noTarget = !hasTarget;
	return { generate: form };
};

export const actions: Actions = {
	default: (event) => generate(event)
};
