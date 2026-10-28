import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/documents/handler.go index, createNote, upload, reindex,
// retryEmbeddings. Every write lands back on /app/knowledge, as Go's 303s did.

export const load: PageServerLoad = async (event) => {
	event.depends('north:knowledge');
	const { data } = await serverApi(event).GET('/knowledge');
	return { library: data! };
};

/** A 4xx comes back to the form; anything else is the error page's. */
function refused(err: unknown, fallbackField: string, extra: Record<string, unknown> = {}) {
	if (isApiError(err) && err.status < 500) {
		const errors = Object.keys(err.fields).length > 0 ? err.fields : { [fallbackField]: err.message };
		return fail(err.status, { ...extra, errors });
	}
	throw err;
}

async function post(event: RequestEvent, path: '/knowledge/reindex' | '/knowledge/retry-embeddings') {
	try {
		await serverApi(event).POST(path);
	} catch (err) {
		return refused(err, 'action');
	}
	redirect(303, '/app/knowledge');
}

export const actions: Actions = {
	note: async (event) => {
		const form = await event.request.formData();
		const title = String(form.get('title') ?? '').trim();
		const body = String(form.get('body') ?? '').trim();
		try {
			await serverApi(event).POST('/knowledge/notes', { body: { title, body } });
		} catch (err) {
			return refused(err, 'body', { title, body });
		}
		redirect(303, '/app/knowledge');
	},

	upload: async (event) => {
		const form = await event.request.formData();
		const file = form.get('file');
		if (!(file instanceof File) || (file.size === 0 && file.name === '')) {
			// Go: "Choose a file first." — the same sentence the API uses.
			return fail(422, { errors: { file: 'Choose a file first.' } });
		}
		const body = new FormData();
		body.set('file', file, file.name);
		try {
			// openapi-fetch passes FormData through untouched, boundary and all.
			await serverApi(event).POST('/knowledge/uploads', { body: body as unknown as { file: string } });
		} catch (err) {
			return refused(err, 'file');
		}
		redirect(303, '/app/knowledge');
	},

	reindex: (event) => post(event, '/knowledge/reindex'),
	retryEmbeddings: (event) => post(event, '/knowledge/retry-embeddings')
};
