import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/moderation/handler.go (GET /app/ops/moderation, POST
// .../{kind}/{subjectID}/{action}, POST .../users/{userID}/suspend). The queue is
// for the people in OPERATOR_USER_IDS; the API answers 404 for anyone else, as
// the Go page did.
export const load: PageServerLoad = async (event) => {
	try {
		const { data } = await serverApi(event).GET('/ops/moderation');
		return { reports: data!.reports };
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	}
};

function done(err: unknown): never {
	if (isApiError(err) && err.status === 404) error(404, 'Not found.');
	if (isApiError(err) && err.status === 422) error(422, err.message);
	throw err;
}

export const actions: Actions = {
	decide: async (event) => {
		const form = await event.request.formData();
		const kind = String(form.get('kind') ?? '');
		const subjectID = String(form.get('subject') ?? '');
		const action = String(form.get('action') ?? '');
		try {
			await serverApi(event).POST('/ops/moderation/{kind}/{subjectID}/{action}', {
				params: { path: { kind, subjectID, action } }
			});
		} catch (err) {
			done(err);
		}
		redirect(303, '/app/ops/moderation');
	},
	suspend: async (event) => {
		const form = await event.request.formData();
		const userID = String(form.get('user') ?? '');
		const hours = Number.parseInt(String(form.get('hours') ?? '0'), 10);
		try {
			await serverApi(event).POST('/ops/moderation/users/{userID}/suspend', {
				params: { path: { userID } },
				body: { hours: Number.isFinite(hours) && hours > 0 ? hours : 0 }
			});
		} catch (err) {
			done(err);
		}
		redirect(303, '/app/ops/moderation');
	}
};
