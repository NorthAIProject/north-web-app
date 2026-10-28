import { fail } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { WorkoutDraft } from '#lib/features/training/types.js';
import type { Actions } from './$types';

// Go: internal/planimport/handler.go workoutUpload / workoutParse. The parse
// answers with the review at the same URL, as Go's did.
//
// error is a sentence to show as-is (the API's, already in the reader's
// language, or a file's own refusal); errorKey is a catalogue key.
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const file = form.get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(422, { draft: null as WorkoutDraft | null, error: '', errorKey: 'planimport.err.nofile' });
		}
		const body = new FormData();
		body.set('file', file, file.name);
		try {
			const { data } = await serverApi(event).POST('/training/import/parse', {
				body: body as never,
				bodySerializer: (b: unknown) => b as FormData
			});
			return { draft: data as WorkoutDraft, error: '', errorKey: '' };
		} catch (err) {
			if (!isApiError(err)) throw err;
			return fail(err.status, {
				draft: null as WorkoutDraft | null,
				error: Object.values(err.fields)[0] ?? err.message,
				errorKey: ''
			});
		}
	}
};
