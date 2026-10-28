import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { formFrom, inputFrom } from '#lib/features/decisions/form.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/decisions/handler.go — GET/POST /app/decisions/{id} and
// POST /app/decisions/{id}/delete.

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function decisionID(event: Pick<RequestEvent, 'params'>): string {
	const id = event.params.id ?? '';
	if (!uuidPattern.test(id)) error(404, 'Not found.');
	return id;
}

function notFound(err: unknown): never {
	if (isApiError(err) && err.status === 404) error(404, 'Not found.');
	throw err;
}

export const load: PageServerLoad = async (event) => {
	event.depends('north:decisions');
	const id = decisionID(event);
	const { data } = await serverApi(event)
		.GET('/decisions/{decisionID}', { params: { path: { decisionID: id } } })
		.catch(notFound);
	return { decision: data! };
};

export const actions: Actions = {
	// The edit form is the only writer of outcome and always submits it, so the
	// posted value wins — including an emptied one, which retracts a review.
	update: async (event) => {
		const id = decisionID(event);
		const form = formFrom(await event.request.formData());
		try {
			await serverApi(event).PUT('/decisions/{decisionID}', {
				params: { path: { decisionID: id } },
				body: inputFrom(form)
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422) return fail(422, { ...form, errors: err.fields });
			notFound(err);
		}
		redirect(303, `/app/decisions/${id}`);
	},

	delete: async (event) => {
		const id = decisionID(event);
		try {
			await serverApi(event).DELETE('/decisions/{decisionID}', { params: { path: { decisionID: id } } });
		} catch (err) {
			notFound(err);
		}
		redirect(303, '/app/decisions');
	}
};
