import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { orNotFound } from '#lib/features/profiles/load.js';
import { profileBase } from '#lib/features/profiles/profile.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/profiles/handler.go (GET /app/u/{handle}, POST .../follow, .../unfollow).
export const load: PageServerLoad = async (event) => {
	event.depends('north:profile');
	const handle = event.params.handle;
	const { data } = await orNotFound(serverApi(event).GET('/profiles/{handle}', { params: { path: { handle } } }));
	return { profile: data! };
};

/** Go answered 404 for an unknown handle and 422 for anything it could not read. */
function fail(err: unknown): never {
	if (isApiError(err) && err.status === 404) error(404, 'Not found.');
	if (isApiError(err) && err.status === 422) error(422, 'That request could not be read.');
	throw err;
}

export const actions: Actions = {
	follow: async (event) => {
		const handle = event.params.handle;
		try {
			await serverApi(event).POST('/follows', { body: { handle } });
		} catch (err) {
			fail(err);
		}
		redirect(303, profileBase(handle));
	},
	unfollow: async (event) => {
		const handle = event.params.handle;
		const api = serverApi(event);
		try {
			const { data } = await api.GET('/profiles/{handle}', { params: { path: { handle } } });
			await api.DELETE('/follows/{userID}', { params: { path: { userID: data!.id } } });
		} catch (err) {
			fail(err);
		}
		redirect(303, profileBase(handle));
	}
};
