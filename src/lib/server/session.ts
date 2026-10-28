import type { Cookies } from '@sveltejs/kit';
import { secureCookies } from './config';

// The session is north-client's bearer token, kept in an HttpOnly cookie so
// page JavaScript can never read it. Server code reads it to call the API; the
// /api proxy reads it to forward browser requests.

export const sessionCookie = 'khepri_session';

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
