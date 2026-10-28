import { error, fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { highlightRange } from '#lib/features/knowledge/format.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/documents/handler.go show, reindexOne, destroy.

export const load: PageServerLoad = async (event) => {
	const documentID = event.params.id;
	const { from, to } = highlightRange(event.url);
	const api = serverApi(event);
	try {
		const { data } = await api.GET('/knowledge/{documentID}', { params: { path: { documentID } } });
		return { doc: data!, readError: '', from, to };
	} catch (err) {
		if (isApiError(err) && (err.status === 404 || err.status === 400)) error(404, 'Not found.');
		if (!isApiError(err) || err.status < 500) throw err;
		// Go renders the record without a body when its bytes cannot be read:
		// the reason says more than a 500. The API only says it failed, so the
		// record comes from the list and the API's sentence stands in for the reason.
		const { data: list } = await api.GET('/knowledge');
		const doc = list?.documents.find((d) => d.id === documentID);
		if (!doc) throw err;
		return { doc: { ...doc, text: '', headings: [] }, readError: err.message, from, to };
	}
};

function refused(err: unknown) {
	if (isApiError(err) && err.status === 404) error(404, 'Not found.');
	if (isApiError(err) && err.status < 500) return fail(err.status, { errors: { action: err.message } });
	throw err;
}

export const actions: Actions = {
	reindex: async (event) => {
		try {
			await serverApi(event).POST('/knowledge/{documentID}/reindex', {
				params: { path: { documentID: event.params.id } }
			});
		} catch (err) {
			return refused(err);
		}
		redirect(303, '/app/knowledge');
	},

	delete: async (event) => {
		try {
			await serverApi(event).DELETE('/knowledge/{documentID}', { params: { path: { documentID: event.params.id } } });
		} catch (err) {
			return refused(err);
		}
		redirect(303, '/app/knowledge');
	}
};
