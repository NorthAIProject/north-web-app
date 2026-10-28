import type { Cookies } from '@sveltejs/kit';
import { secureCookies } from './config';

// The MCP consent screen's browser binding (Go: mcpauth.BrowserHandler's
// north_oauth_req cookie). north-client parks the authorization request and
// hands back a verifier once; this server keeps it HttpOnly on /oauth and
// quotes it on every consent call, so a guessed request id is useless from
// another browser. Lax, not Strict: the browser arrives by a top-level
// redirect from the client, and Strict would withhold it on exactly that.

export const oauthRequestCookie = 'north_oauth_req';
const requestTTL = 10 * 60;

export function writeOAuthVerifier(cookies: Cookies, url: URL, verifier: string) {
	cookies.set(oauthRequestCookie, verifier, {
		path: '/oauth',
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookies(url),
		maxAge: requestTTL
	});
}

export function readOAuthVerifier(cookies: Cookies): string {
	return cookies.get(oauthRequestCookie) ?? '';
}

export function clearOAuthVerifier(cookies: Cookies, url: URL) {
	cookies.delete(oauthRequestCookie, { path: '/oauth', secure: secureCookies(url) });
}

/** Stops the consent screen being framed (clickjacking a one-click grant). */
export const frameGuardHeaders = {
	'x-frame-options': 'DENY',
	'content-security-policy': "frame-ancestors 'none'"
};

/** Where Google and passkeys come back to: only the request id travels. */
export function resumePath(requestId: string): string {
	return `/oauth/authorize/resume?request_id=${encodeURIComponent(requestId)}`;
}
