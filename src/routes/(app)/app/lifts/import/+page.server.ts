import { fail } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions } from './$types';

// Go: internal/lifts/handler.go importPage / importUpload (GET/POST /app/lifts/import).

/** The export's size cap, as Go's lifts.MaxImportBytes. */
const MAX_IMPORT_BYTES = 10 << 20;

export const actions: Actions = {
	default: async (event) => {
		let form: FormData;
		try {
			form = await event.request.formData();
		} catch {
			return fail(422, { errorKey: 'lifts.err.upload' });
		}
		const file = form.get('file');
		if (!(file instanceof File) || file.size === 0) return fail(422, { errorKey: 'lifts.err.nofile' });
		if (file.size > MAX_IMPORT_BYTES) return fail(422, { errorKey: 'lifts.err.toolarge' });

		const upload = new FormData();
		upload.set('file', file, file.name || 'hevy.csv');
		try {
			const { data } = await serverApi(event).POST('/lifts/import/hevy', {
				body: upload as unknown as { file: string },
				bodySerializer: (body) => body as unknown as FormData
			});
			return { result: data! };
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { error: Object.values(err.fields)[0] || err.message });
			}
			if (isApiError(err)) return fail(err.status >= 500 ? 500 : err.status, { errorKey: 'lifts.err.generic' });
			throw err;
		}
	}
};
