import type { RequestEvent } from '@sveltejs/kit';
import { createApi, type Api } from '#lib/api/client.js';
import { apiBaseUrl } from './config';

/** The API client for server code, authenticated as the request's user. */
export function serverApi(event: Pick<RequestEvent, 'fetch' | 'locals'>): Api {
	return createApi({
		fetch: event.fetch,
		baseUrl: apiBaseUrl(),
		token: event.locals.session?.token,
		locale: event.locals.locale
	});
}
