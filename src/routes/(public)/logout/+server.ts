import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { clearSession } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

// A POST, never a link: a GET that ends a session can be fired by any image
// tag on any page on the internet.
export const POST: RequestHandler = async (event) => {
	if (event.locals.session) {
		try {
			await serverApi(event).POST('/auth/logout');
		} catch {
			// The session may already be gone server-side; the cookie goes either way.
		}
	}
	clearSession(event.cookies, event.url);
	redirect(303, '/');
};
