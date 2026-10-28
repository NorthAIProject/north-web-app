import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { formFailure } from '#lib/server/form.js';
import { writeSession } from '#lib/server/session.js';
import { fetchAuthOptions } from '#lib/features/auth/options.js';
import type { Actions, PageServerLoad } from './$types';

// GET /signup (Go: auth.Handler.showSignup).
export const load: PageServerLoad = async (event) => {
	if (event.locals.session?.user) redirect(303, '/app');
	return { authOptions: await fetchAuthOptions(serverApi(event)) };
};

// POST /signup (Go: auth.Handler.submitSignup): every field problem at once,
// under its own input; the new account lands signed in on /app, where the
// layout sends it on to onboarding.
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const values = {
			email: String(form.get('email') ?? ''),
			display_name: String(form.get('display_name') ?? ''),
			timezone: String(form.get('timezone') ?? '')
		};
		const password = String(form.get('password') ?? '');
		const passwordConfirmation = String(form.get('password_confirmation') ?? '');

		try {
			const { data } = await serverApi(event).POST('/auth/signup', {
				body: {
					email: values.email,
					displayName: values.display_name,
					password,
					passwordConfirmation,
					timezone: values.timezone
				}
			});
			writeSession(event.cookies, event.url, data!.token, data!.expiresAt);
		} catch (err) {
			return formFailure(err, values);
		}
		redirect(303, '/app');
	}
};
