import { NORTH_API_URL } from '$app/env/private';

// Where north-client's JSON API lives, as seen from this server (src/env.ts).
export function apiBaseUrl(): string {
	return NORTH_API_URL;
}

/** True when cookies should carry Secure: anything not on plain localhost. */
export function secureCookies(url: URL): boolean {
	return url.protocol === 'https:';
}
