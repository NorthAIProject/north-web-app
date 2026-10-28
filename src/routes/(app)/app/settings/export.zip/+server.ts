import { error, redirect } from '@sveltejs/kit';
import { apiBaseUrl } from '#lib/server/config.js';
import type { RequestHandler } from './$types';

// Go: export.Handler on GET /app/settings/export.zip. The archive streams
// straight through from the API's GET /account/export; a spent quota answers
// 429 with the API's message as plain text, as the Go page did.
export const GET: RequestHandler = async ({ locals, fetch }) => {
	const token = locals.session?.token;
	// Signed out goes to the login page, as everything under /app does.
	if (!token) redirect(303, `/login?next=${encodeURIComponent('/app/settings/export.zip')}`);

	const upstream = await fetch(`${apiBaseUrl()}/account/export`, {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/zip' }
	});
	if (upstream.status === 429) {
		let message = 'You have exported your data a few times just now. Try again shortly.';
		try {
			message = ((await upstream.json()) as { error?: { message?: string } }).error?.message || message;
		} catch {
			// Keep the default.
		}
		const headers = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
		const retry = upstream.headers.get('Retry-After');
		if (retry) headers.set('Retry-After', retry);
		return new Response(message + '\n', { status: 429, headers });
	}
	if (!upstream.ok || !upstream.body) {
		error(upstream.ok ? 502 : upstream.status, { message: 'The export could not be started.' });
	}

	return new Response(upstream.body, {
		status: 200,
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': upstream.headers.get('Content-Disposition') ?? 'attachment; filename="north-export.zip"',
			'Cache-Control': 'no-store'
		}
	});
};
