import { error, redirect } from '@sveltejs/kit';
import { isAppearance } from '#lib/theme.js';
import { serverApi } from '#lib/server/api.js';
import { writeAppearanceCookie } from '#lib/server/preferences.js';
import { safeNext } from '#lib/server/redirect.js';
import type { RequestHandler } from './$types';

// The appearance switcher. Unlike /locale it also writes the account when
// somebody is signed in, because the switcher is shown to them too and a
// toggle that the account's stored value then overrode would visibly do
// nothing. A fetch from the switcher gets 204; a plain form post a redirect.
export const POST: RequestHandler = async (event) => {
	const { request, cookies, url, locals } = event;
	const form = await request.formData();
	const appearance = form.get('appearance');
	if (!isAppearance(appearance)) error(400, { message: 'Unknown appearance.' });

	if (locals.session) {
		await serverApi(event).PUT('/settings/appearance', { body: { appearance, surface: 'switcher' } });
	}
	writeAppearanceCookie(cookies, url, appearance);

	if (request.headers.get('accept')?.includes('application/json')) return new Response(null, { status: 204 });
	redirect(303, safeNext(form.get('next')));
};
