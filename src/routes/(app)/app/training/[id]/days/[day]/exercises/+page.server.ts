import { error, redirect } from '@sveltejs/kit';
import { edits } from '#lib/features/training/edits.js';
import type { Actions, PageServerLoad } from './$types';

// Go: handler.go addExercise as a plain form post — the exercise page's "add
// to a day" (exercises_view.go). It lands on the plan the edit produced; a
// superseded plan lands on its current version (Go: afterEditError). The plan
// page's own picker edits through the /api proxy instead.
export const load: PageServerLoad = ({ params }) => redirect(303, `/app/training/${params.id}`);

export const actions: Actions = {
	default: async (event) => {
		const day = Number.parseInt(event.params.day, 10);
		if (Number.isNaN(day) || day < 0) error(422, 'That request could not be read.');
		const form = await event.request.formData();
		const slug = String(form.get('catalog_slug') ?? '');
		const { plan } = await edits.add(event.params.id, day, slug, event.fetch);
		redirect(303, `/app/training/${plan.id}`);
	}
};
