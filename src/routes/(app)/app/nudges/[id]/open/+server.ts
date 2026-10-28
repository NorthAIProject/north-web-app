import { openAndRedirect } from '#lib/features/nudges/server.js';
import type { RequestHandler } from './$types';

// The link a push notification carries (Go GET /app/nudges/{id}/open): a GET
// because a notification tap can only navigate. ?from=push credits the lock
// screen; anything else counts as the bell.
export const GET: RequestHandler = (event) =>
	openAndRedirect(event, event.url.searchParams.get('from') === 'push' ? 'push' : 'bell');
