import createClient, { type Client, type Middleware } from 'openapi-fetch';
import type { paths } from './generated/schema.js';
import { apiErrorFrom } from './errors.js';

// The one typed boundary to north-client's /api/v1.
//
// Server code (load functions, actions, hooks) talks to the API directly with
// the session's bearer. Browser code talks to this app's own /api proxy
// (src/routes/api/[...path]/+server.ts), which adds the bearer from the
// HttpOnly cookie — the token never reaches JavaScript.
//
// Both return the same openapi-fetch client typed from the generated contract,
// so a feature module writes `api.GET('/goals')` once and it works on either
// side.

export type Api = Client<paths>;
export type { paths };

type Fetch = typeof fetch;

export type ApiOptions = {
	fetch: Fetch;
	baseUrl: string;
	token?: string;
	locale?: string;
};

/** Throws ApiError for every non-2xx response, so callers only see data. */
const throwOnError: Middleware = {
	async onResponse({ response }) {
		if (!response.ok) throw await apiErrorFrom(response);
		return undefined;
	}
};

export function createApi({ fetch, baseUrl, token, locale }: ApiOptions): Api {
	const headers: Record<string, string> = { Accept: 'application/json' };
	if (token) headers.Authorization = `Bearer ${token}`;
	if (locale) headers['Accept-Language'] = locale;
	const client = createClient<paths>({ baseUrl, fetch, headers });
	client.use(throwOnError);
	return client;
}

/** The client browser code uses: same-origin, through the proxy. */
export function browserApi(fetchImpl: Fetch = fetch): Api {
	return createApi({ fetch: fetchImpl, baseUrl: '/api' });
}

/**
 * Unwraps an openapi-fetch result. Errors were already thrown by the
 * middleware; a 204 comes back as undefined data, which this returns as-is.
 */
export async function unwrap<T>(result: Promise<{ data?: T; error?: unknown }>): Promise<T> {
	const { data } = await result;
	return data as T;
}
