import { error, fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { formFailure } from '#lib/server/form.js';
import { writeSession } from '#lib/server/session.js';
import { fetchAuthOptions } from '#lib/features/auth/options.js';
import type { Actions, PageServerLoad } from './$types';

// GET /reset-password?token=… (Go: auth.Handler.showResetPassword). The
// emailed link is north-client's BASE_URL + /reset-password?token=…, so this
// path and parameter must not change.
export const load: PageServerLoad = async (event) => {
	if (!(await fetchAuthOptions(serverApi(event))).passwordReset) error(404, 'Not found');
	if (event.locals.session?.user) redirect(303, '/app');
	return { token: event.url.searchParams.get('token') ?? '' };
};

// POST /reset-password: sets the password, revokes every other session and
// signs in here (Go: submitResetPassword → home).
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const token = String(form.get('token') ?? '');
		try {
			const { data } = await serverApi(event).POST('/auth/reset-password', {
				body: {
					token,
					password: String(form.get('password') ?? ''),
					passwordConfirmation: String(form.get('password_confirmation') ?? '')
				}
			});
			writeSession(event.cookies, event.url, data!.token, data!.expiresAt);
		} catch (err) {
			if (isApiError(err) && err.code === 'invalid_reset_token') {
				return fail(401, { values: { token }, errors: {} as Record<string, string>, error: err.message });
			}
			return formFailure(err, { token });
		}
		redirect(303, '/app');
	}
};
