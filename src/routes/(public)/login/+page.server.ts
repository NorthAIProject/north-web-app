import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { safeNext } from '#lib/server/redirect.js';
import { writeSession } from '#lib/server/session.js';
import { fetchAuthOptions, googleErrorKeys } from '#lib/features/auth/options.js';
import type { Actions, PageServerLoad } from './$types';

// GET /login (Go: auth.Handler.showLogin). A signed-in visitor goes home; a
// next that is not a local path is dropped, as SafeRedirect drops it.
export const load: PageServerLoad = async (event) => {
	const { locals, url } = event;
	if (locals.session?.user) redirect(303, safeNext(url.searchParams.get('next'), '/app'));
	return {
		next: safeNext(url.searchParams.get('next'), ''),
		authOptions: await fetchAuthOptions(serverApi(event)),
		// A Google round trip that failed comes back here with its reason.
		googleError: googleErrorKeys[url.searchParams.get('google') ?? ''] ?? ''
	};
};

// POST /login (Go: auth.Handler.submitLogin).
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		const next = safeNext(form.get('next'), '/app');

		try {
			const { data } = await serverApi(event).POST('/auth/login', { body: { email, password } });
			writeSession(event.cookies, event.url, data!.token, data!.expiresAt);
		} catch (err) {
			// One form-level message: saying which half was wrong tells an
			// attacker which addresses are registered.
			if (isApiError(err) && err.status < 500) return fail(err.status, { email, error: err.message });
			throw err;
		}
		redirect(303, next);
	}
};
