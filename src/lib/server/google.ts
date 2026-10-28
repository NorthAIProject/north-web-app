import type { Cookies } from '@sveltejs/kit';
import { secureCookies } from './config';

// Google's web redirect flow, BFF side (Go: auth.Handler.googleStart and
// googleCallback). north-client keeps the client secret and builds the
// consent URL; this server keeps the state. Same cookie name, lifetime and
// "state|next" value as Go, so a flow started before a deploy finishes after it.

export const googleStateCookie = 'north_google_oauth';
const stateTTL = 10 * 60;

/** The callback Google sends the browser back to: this site's, as registered in the Google console. */
export function googleRedirectUri(url: URL): string {
	return `${url.origin}/auth/google/callback`;
}

export function writeGoogleState(cookies: Cookies, url: URL, state: string, next: string) {
	// next rides beside the state so a forged state alone cannot set a redirect.
	cookies.set(googleStateCookie, next ? `${state}|${next}` : state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookies(url),
		maxAge: stateTTL
	});
}

/** Reads and clears the state cookie: it is single-use whatever happens next. */
export function takeGoogleState(cookies: Cookies, url: URL): { state: string; next: string } | undefined {
	const value = cookies.get(googleStateCookie);
	cookies.delete(googleStateCookie, { path: '/', secure: secureCookies(url) });
	if (!value) return undefined;
	const at = value.indexOf('|');
	return at < 0 ? { state: value, next: '' } : { state: value.slice(0, at), next: value.slice(at + 1) };
}

/** Constant-time string comparison, as Go's subtle.ConstantTimeCompare. */
export function sameState(a: string, b: string): boolean {
	if (a.length !== b.length || a.length === 0) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}
