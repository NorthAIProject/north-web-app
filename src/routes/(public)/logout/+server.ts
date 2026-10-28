import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { safeNext } from '#lib/server/redirect.js';
import { clearSession } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

// POST /logout (Go: auth.Handler.logout). A POST, never a link: a GET that
// ends a session can be fired by any image tag on any page on the internet.
//
// Lands on /login, or on next when it is a local path: the consent screen's
// "not you?" signs out and comes back to the waiting authorization request.
export const POST: RequestHandler = async (event) => {
	if (event.locals.session) {
		try {
			await serverApi(event).POST('/auth/logout');
		} catch {
			// The session may already be gone server-side; the cookie goes either way.
		}
	}
	clearSession(event.cookies, event.url);

	let next: FormDataEntryValue | null = null;
	try {
		next = (await event.request.formData()).get('next');
	} catch {
		// No form body: a bare POST signs out to /login.
	}
	redirect(303, safeNext(next, '/login'));
};
