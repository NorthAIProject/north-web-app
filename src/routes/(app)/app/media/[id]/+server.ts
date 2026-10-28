import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

// Go: internal/media/handler.go serve (GET /app/media/{id}). Redirects to a
// short-lived signed URL so the bytes come from object storage, not through
// this app. Chat photos, progress photos and form clips all point here.
export const GET: RequestHandler = async (event) => {
	if (!event.locals.session) {
		redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
	}
	try {
		const { data } = await serverApi(event).GET('/media/{mediaID}', {
			params: { path: { mediaID: event.params.id } }
		});
		// The storage origin is configuration (MinIO locally, R2/S3 in prod), and
		// the URL comes from our own API, so any origin is allowed here.
		redirect(302, data!.url, { external: true });
	} catch (err) {
		if (isApiError(err) && (err.status === 404 || err.status === 400 || err.status === 422)) error(404, 'Not found.');
		throw err;
	}
};
