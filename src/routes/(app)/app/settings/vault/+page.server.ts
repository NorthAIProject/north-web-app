import { error, fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/vault/handler.go. Dev-only there (a hosted server cannot read a
// folder on somebody's machine), and the API is the gate here: a deployment
// that switched the vault off answers 404, and so does this page.
export const load: PageServerLoad = async (event) => {
	try {
		const { data } = await serverApi(event).GET('/settings/vault');
		return { vault: data! };
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, { message: 'Not found.' });
		throw err;
	}
};

const back = '/app/settings/vault';

export const actions: Actions = {
	connect: async (event) => {
		const form = await event.request.formData();
		const rootPath = String(form.get('root_path') ?? '');
		try {
			await serverApi(event).PUT('/settings/vault', { body: { rootPath } });
		} catch (err) {
			if (isApiError(err) && err.status === 422) return fail(422, { errors: err.fields, rootPath });
			throw err;
		}
		redirect(303, back);
	},
	disconnect: async (event) => {
		await serverApi(event).DELETE('/settings/vault');
		redirect(303, back);
	},
	sync: async (event) => {
		await serverApi(event).POST('/settings/vault/sync');
		redirect(303, back);
	}
};
