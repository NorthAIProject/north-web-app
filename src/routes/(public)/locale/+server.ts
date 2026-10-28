import { redirect } from '@sveltejs/kit';
import { isLocale } from '#lib/i18n/locales.js';
import { writeLocaleCookie } from '#lib/server/preferences.js';
import { safeNext } from '#lib/server/redirect.js';
import type { RequestHandler } from './$types';

// The public pages' language switcher. Signed-in people change language in
// Settings, which writes the account; this only remembers a visitor's choice.
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const form = await request.formData();
	const locale = form.get('locale');
	writeLocaleCookie(cookies, url, isLocale(locale) ? locale : '');
	redirect(303, safeNext(form.get('next')));
};
