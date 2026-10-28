import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { formInput, formPhotos, readForm, webFieldErrors } from '#lib/features/progress/view.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/progresschecks/handler.go — GET /app/progress (show) and its
// form posts, here as named actions on the same page:
//   POST /app/progress              → ?/create
//   POST /app/progress/schedule     → ?/schedule
//   POST /app/progress/{id}/delete  → ?/delete (id in the form)
//   POST /app/progress/compare      → ?/compare
// POST /app/progress/estimate (the htmx fields swap) is a browser call to
// /api/progress/checks/estimate from the page, so the chosen photos stay put.
export const load: PageServerLoad = async (event) => {
	event.depends('north:progress');
	const api = serverApi(event);
	const [checks, assist] = await Promise.all([
		api.GET('/progress/checks').then((r) => r.data!),
		api.GET('/progress/assist').then((r) => r.data!)
	]);
	return { checks, assist };
};

export const actions: Actions = {
	create: async (event) => {
		const data = await event.request.formData().catch(() => null);
		if (!data) return fail(422, { errors: { front: 'progress.error.upload' }, values: null, i18nErrors: true });
		const values = readForm(data);
		const { input, errors } = formInput(values);
		if (Object.keys(errors).length) return fail(422, { errors, values, i18nErrors: false });

		const body = new FormData();
		body.set('check', JSON.stringify(input));
		for (const [pose, file] of formPhotos(data)) body.set(pose, file, file.name);
		try {
			await serverApi(event).POST('/progress/checks', {
				body: body as never,
				bodySerializer: (b: unknown) => b as FormData
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422 && Object.keys(err.fields).length) {
				return fail(422, { errors: webFieldErrors(err.fields), values, i18nErrors: false });
			}
			throw err;
		}
		redirect(303, '/app/progress');
	},

	schedule: async (event) => {
		const data = await event.request.formData();
		const cadence = String(data.get('cadence') ?? '');
		await serverApi(event).PUT('/progress/schedule', { body: { cadence } });
		redirect(303, '/app/progress');
	},

	delete: async (event) => {
		const data = await event.request.formData();
		const checkID = String(data.get('id') ?? '');
		await serverApi(event).DELETE('/progress/checks/{checkID}', { params: { path: { checkID } } });
		redirect(303, '/app/progress');
	},

	compare: async (event) => {
		try {
			await serverApi(event).POST('/progress/compare');
		} catch (err) {
			if (!isApiError(err)) throw err;
			// Go: the page with the reason beside the button.
			const key =
				err.status === 422
					? 'progress.compare.need'
					: err.kind === 'unavailable'
						? 'progress.compare.unavailable'
						: err.status === 429
							? ''
							: 'progress.compare.failed';
			return fail(422, { compareError: key || err.message });
		}
		redirect(303, '/app/progress#progress-compare');
	}
};
