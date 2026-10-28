import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/memories/handler.go — GET /app/memories and every POST under it.
// Each Go form posts to its own URL (/app/memories/{id}/pin …); here they are
// named actions on the page carrying the id as a hidden field, and like Go
// they all land back on /app/memories.
export const load: PageServerLoad = async (event) => {
	event.depends('north:memories');
	const { data } = await serverApi(event).GET('/memories');
	return { pending: data!.pending, approved: data!.approved };
};

type Fields = { category: string; content: string };

async function readFields(event: RequestEvent) {
	const form = await event.request.formData();
	const id = String(form.get('id') ?? '');
	const fields: Fields = {
		category: String(form.get('category') ?? '').trim(),
		content: String(form.get('content') ?? '').trim()
	};
	return { id, fields };
}

async function memoryId(event: RequestEvent): Promise<string> {
	const id = String((await event.request.formData()).get('id') ?? '');
	if (!id) error(404, 'Not found.');
	return id;
}

/** Runs a write; a missing memory is a 404 page, as in Go. */
async function write(op: () => Promise<unknown>) {
	try {
		await op();
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	}
	redirect(303, '/app/memories');
}

export const actions: Actions = {
	create: async (event) => {
		const { fields } = await readFields(event);
		try {
			await serverApi(event).POST('/memories', { body: fields });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { create: { ...fields, errors: err.fields } });
			}
			throw err;
		}
		redirect(303, '/app/memories');
	},

	update: async (event) => {
		const { id, fields } = await readFields(event);
		if (!id) error(404, 'Not found.');
		try {
			await serverApi(event).PUT('/memories/{memoryID}', { params: { path: { memoryID: id } }, body: fields });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { edit: { id, ...fields, errors: err.fields } });
			}
			if (isApiError(err) && err.status === 404) error(404, 'Not found.');
			throw err;
		}
		redirect(303, '/app/memories');
	},

	approve: async (event) => {
		const memoryID = await memoryId(event);
		return write(() => serverApi(event).POST('/memories/{memoryID}/approve', { params: { path: { memoryID } } }));
	},

	reject: async (event) => {
		const memoryID = await memoryId(event);
		return write(() => serverApi(event).POST('/memories/{memoryID}/reject', { params: { path: { memoryID } } }));
	},

	pin: async (event) => {
		const memoryID = await memoryId(event);
		return write(() =>
			serverApi(event).PUT('/memories/{memoryID}/pinned', { params: { path: { memoryID } }, body: { value: true } })
		);
	},

	unpin: async (event) => {
		const memoryID = await memoryId(event);
		return write(() =>
			serverApi(event).PUT('/memories/{memoryID}/pinned', { params: { path: { memoryID } }, body: { value: false } })
		);
	},

	exclude: async (event) => {
		const memoryID = await memoryId(event);
		return write(() =>
			serverApi(event).PUT('/memories/{memoryID}/excluded', { params: { path: { memoryID } }, body: { value: true } })
		);
	},

	include: async (event) => {
		const memoryID = await memoryId(event);
		return write(() =>
			serverApi(event).PUT('/memories/{memoryID}/excluded', { params: { path: { memoryID } }, body: { value: false } })
		);
	},

	delete: async (event) => {
		const memoryID = await memoryId(event);
		return write(() => serverApi(event).DELETE('/memories/{memoryID}', { params: { path: { memoryID } } }));
	}
};
