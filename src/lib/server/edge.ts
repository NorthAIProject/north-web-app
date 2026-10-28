// The paths north-client keeps serving after the web moves to SvelteKit: its
// JSON API, the MCP endpoint and its OAuth server, the health ingest and the
// webhooks. On Cloudflare the Worker runs for the whole host, so it hands these
// straight to the Go origin before doing any SvelteKit work.
//
// Prefixes are matched exactly, because neighbours belong to SvelteKit:
// /api/<x> is this app's proxy, /oauth/authorize is the consent page, and
// /.well-known/apple-app-site-association is served here.

const goExact = new Set(['/mcp', '/healthz', '/oauth/token', '/oauth/register', '/oauth/revoke']);

const goPrefixes = [
	'/api/v1/',
	'/mcp/',
	'/.well-known/oauth-',
	'/ingest/',
	'/webhooks/',
	'/internal/metrics'
];

export function isGoPath(pathname: string): boolean {
	return goExact.has(pathname) || pathname === '/api/v1' || goPrefixes.some((p) => pathname.startsWith(p));
}

/** The same request, sent to the Go origin. Streams both ways; redirects are the client's to follow. */
export function toGo(request: Request, origin: string): Promise<Response> {
	const url = new URL(request.url);
	const target = new URL(url.pathname + url.search, origin);
	return fetch(new Request(target, request), { redirect: 'manual' });
}
