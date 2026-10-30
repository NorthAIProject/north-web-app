import type { RequestHandler } from './$types';
import { clientAddress } from '#lib/server/api.js';
import { apiBaseUrl } from '#lib/server/config.js';
import { clearSession } from '#lib/server/session.js';

// Same-origin passthrough to north-client's /api/v1 for browser code.
//
// The browser never holds the bearer: it sits in the HttpOnly session cookie,
// and this handler adds it on the way through. That is what lets client-side
// fetches, SSE streams (coach replies, crew chat) and multipart uploads work
// without putting a token in JavaScript.
//
// CSRF: SvelteKit's origin check already refuses cross-site form-encoded and
// multipart posts to this route, and a cross-site JSON post cannot be sent
// without a CORS preflight this app never answers. SameSite=Lax on the cookie
// is the third layer.

const forwardedRequestHeaders = ['content-type', 'accept', 'last-event-id', 'x-request-id', 'if-none-match'];
const forwardedResponseHeaders = [
	'content-type',
	'content-disposition',
	'content-length',
	'cache-control',
	'etag',
	'location',
	'retry-after',
	'x-request-id'
];

export const fallback: RequestHandler = async (event) => {
	const { request, params, url, locals, cookies, fetch } = event;
	const target = `${apiBaseUrl()}/${params.path}${url.search}`;

	const headers = new Headers();
	for (const name of forwardedRequestHeaders) {
		const value = request.headers.get(name);
		if (value) headers.set(name, value);
	}
	headers.set('accept-language', locals.locale);
	if (locals.session?.token) headers.set('authorization', `Bearer ${locals.session.token}`);
	const address = clientAddress(event);
	if (address) headers.set('x-real-ip', address);

	const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
	const upstream = await fetch(target, {
		method: request.method,
		headers,
		body: hasBody ? request.body : undefined,
		// Required by fetch to stream a request body (uploads) rather than buffer it.
		...(hasBody ? { duplex: 'half' } : {}),
		signal: request.signal,
		redirect: 'manual'
	} as RequestInit);

	if (upstream.status === 401 && locals.session) {
		// The token died between page load and this call. Drop it so the next
		// navigation lands on sign-in instead of failing every request.
		clearSession(cookies, url);
	}

	const responseHeaders = new Headers();
	for (const name of forwardedResponseHeaders) {
		const value = upstream.headers.get(name);
		if (value) responseHeaders.set(name, value);
	}
	// fetch hands back a decoded body, so a compressed reply's length is wrong
	// for what we send on (north-client gzips /api/v1 replies over 1 KB).
	if (upstream.headers.has('content-encoding')) responseHeaders.delete('content-length');
	if (upstream.headers.get('content-type')?.startsWith('text/event-stream')) {
		// Tell any buffering proxy in front of this one to pass events through as they come.
		responseHeaders.set('cache-control', 'no-cache');
		responseHeaders.set('x-accel-buffering', 'no');
	}

	return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
};
