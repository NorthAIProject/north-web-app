import type { RequestEvent } from '@sveltejs/kit';
import { createApi, type Api } from '#lib/api/client.js';
import { apiBaseUrl } from './config';

type ApiEvent = Pick<RequestEvent, 'fetch' | 'locals'> &
	Partial<Pick<RequestEvent, 'getClientAddress'>>;

/** The API client for server code, authenticated as the request's user. */
export function serverApi(event: ApiEvent): Api {
	return createApi({
		fetch: event.fetch,
		baseUrl: apiBaseUrl(),
		token: event.locals.session?.token,
		locale: event.locals.locale,
		clientAddress: clientAddress(event)
	});
}

/**
 * The browser's address, sent to the API as X-Real-IP. Every call from this
 * server reaches north-client from the same Worker, so without it the API's
 * per-address sign-in limit would count every visitor together. On a call from
 * this zone's own Worker, Cloudflare copies X-Real-IP into CF-Connecting-IP,
 * the one header north-client believes (internal/shared/middleware/clientip.go).
 */
export function clientAddress(
	event: Partial<Pick<RequestEvent, 'getClientAddress'>>
): string | undefined {
	try {
		return event.getClientAddress?.() || undefined;
	} catch {
		// Not every event has an address (prerendering, some test harnesses).
		return undefined;
	}
}
