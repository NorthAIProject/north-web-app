// The nudge endpoints a plain link or form reaches (Go /app/nudges/{id}/…).
// +server.ts routes skip the /app layout's load, so each checks the session
// itself, the way Go's RequireAuth wrapped them.

import { redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';

function requireSession(event: RequestEvent): void {
	if (!event.locals.session?.user) {
		redirect(303, `/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}
}

/** Where a nudge sends the person: its page, or home without one (Go destination). */
function destination(href: string | undefined): string {
	return href && href.startsWith('/') ? href : '/app';
}

/**
 * Opens a nudge (marks it read, credits the channel) and redirects where it
 * points. A nudge dismissed meanwhile, or a bad id, lands on /app rather than
 * an error: the person tapped something Khepri sent them.
 */
export async function openAndRedirect(event: RequestEvent, from: 'bell' | 'push'): Promise<never> {
	requireSession(event);
	let to = '/app';
	try {
		const { data } = await serverApi(event).POST('/nudges/{nudgeID}/open', {
			params: { path: { nudgeID: event.params.id ?? '' }, query: from === 'push' ? { from: 'push' } : {} }
		});
		to = destination(data?.href);
	} catch (err) {
		if (!(isApiError(err) && err.status === 404)) throw err;
	}
	redirect(303, to);
}

/** Dismisses a nudge without JavaScript (the bell's no-JS fallback) and goes home. */
export async function dismissAndRedirect(event: RequestEvent): Promise<never> {
	requireSession(event);
	await serverApi(event).POST('/nudges/{nudgeID}/dismiss', { params: { path: { nudgeID: event.params.id ?? '' } } });
	redirect(303, '/app');
}
