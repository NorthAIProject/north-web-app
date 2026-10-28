import type { Cookies } from '@sveltejs/kit';
import { secureCookies } from './config';

// The session is north-client's bearer token, kept in an HttpOnly cookie so
// page JavaScript can never read it. Server code reads it to call the API; the
// /api proxy reads it to forward browser requests.

// Same name, path and flags as the Go web app's cookie (internal/auth
// SessionCookieName): its value is the same kind of session token, so a person
// signed in on the Go pages stays signed in when this app takes over the
// domain, and the two can run side by side during the cut-over.
export const sessionCookie = 'north_session';

export function readSession(cookies: Cookies): string | undefined {
	return cookies.get(sessionCookie) || undefined;
}

export function writeSession(cookies: Cookies, url: URL, token: string, expiresAt: string | Date) {
	cookies.set(sessionCookie, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookies(url),
		expires: new Date(expiresAt)
	});
}

export function clearSession(cookies: Cookies, url: URL) {
	cookies.delete(sessionCookie, { path: '/', secure: secureCookies(url) });
}
