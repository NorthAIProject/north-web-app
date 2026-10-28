import { redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

// The outreach card's answer without JavaScript (Go POST
// /app/outreach/{id}/actions): answer, then back to My Day. An answer given
// elsewhere already, or a stale card, just returns: My Day shows what is true.
// A +server route skips the /app layout, so it checks the session itself.
export const POST: RequestHandler = async (event) => {
	if (!event.locals.session?.user) redirect(303, '/login?next=%2Fapp');
	const action = String((await event.request.formData()).get('action') ?? '');
	try {
		await serverApi(event).POST('/outreach/{id}/actions', { params: { path: { id: event.params.id } }, body: { action } });
	} catch (err) {
		if (!(isApiError(err) && [404, 409, 422].includes(err.status))) throw err;
	}
	redirect(303, '/app');
};
