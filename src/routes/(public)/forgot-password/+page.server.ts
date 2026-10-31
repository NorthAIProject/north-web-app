import { error, redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { formFailure } from '#lib/server/form.js';
import { fetchAuthOptionsOrUnknown, passwordResetOffered } from '#lib/features/auth/options.js';
import type { Actions, PageServerLoad } from './$types';

// GET /forgot-password (Go: auth.Handler.showForgotPassword): 404 when no
// mailer can deliver the link, as Go hides the journey. When the options
// cannot be read the form shows anyway: a submit either works or comes back
// with the API's error, which beats a 404 for a page that does exist.
export const load: PageServerLoad = async (event) => {
	if (!passwordResetOffered(await fetchAuthOptionsOrUnknown(serverApi(event))))
		error(404, 'Not found');
	if (event.locals.session?.user) redirect(303, '/app');
	return {};
};

// POST /forgot-password: the same success copy whether or not the address
// has an account.
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const values = { email: String(form.get('email') ?? '') };
		try {
			await serverApi(event).POST('/auth/forgot-password', { body: { email: values.email } });
		} catch (err) {
			return formFailure(err, values);
		}
		return { submitted: true as const };
	}
};
