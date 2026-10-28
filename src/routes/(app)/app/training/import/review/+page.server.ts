import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { WorkoutDraft } from '#lib/features/training/types.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/planimport/handler.go workoutReview. Only Save posts here: the
// removes Go round-tripped happen in the page. POST-only in Go too, so a GET
// goes back to the upload.
export const load: PageServerLoad = () => redirect(303, '/app/training/import');

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		let draft: WorkoutDraft;
		try {
			draft = JSON.parse(String(form.get('draft') ?? '')) as WorkoutDraft;
			if (!draft || !Array.isArray(draft.days)) throw new Error('not a draft');
		} catch {
			// The hidden draft did not survive: start again (Go: planimport.err.expired).
			return fail(422, { draft: null as WorkoutDraft | null, error: '', errorKey: 'planimport.err.expired' });
		}
		draft.name = String(form.get('name') ?? draft.name);

		let planID: string;
		try {
			const { data } = await serverApi(event).POST('/training/import', { body: draft });
			planID = data!.planId;
		} catch (err) {
			if (!isApiError(err)) throw err;
			return fail(err.status, { draft, error: Object.values(err.fields)[0] ?? err.message, errorKey: '' });
		}
		redirect(303, `/app/training/${planID}`);
	}
};
