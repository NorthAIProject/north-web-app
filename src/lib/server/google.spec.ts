import { describe, expect, it } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { googleRedirectUri, sameState, takeGoogleState, writeGoogleState } from './google';

function memoryCookies(): Cookies & { jar: Map<string, string> } {
	const jar = new Map<string, string>();
	return {
		jar,
		get: (name: string) => jar.get(name),
		getAll: () => [...jar].map(([name, value]) => ({ name, value })),
		set: (name: string, value: string) => void jar.set(name, value),
		delete: (name: string) => void jar.delete(name),
		serialize: () => ''
	} as unknown as Cookies & { jar: Map<string, string> };
}

const url = new URL('https://kheprios.com/auth/google?next=/app/goals');

describe('google state cookie', () => {
	it('keeps next beside the state and is single-use', () => {
		const cookies = memoryCookies();
		writeGoogleState(cookies, url, 'abc', '/oauth/authorize/resume?request_id=1');
		expect(cookies.jar.get('north_google_oauth')).toBe('abc|/oauth/authorize/resume?request_id=1');
		expect(takeGoogleState(cookies, url)).toEqual({ state: 'abc', next: '/oauth/authorize/resume?request_id=1' });
		expect(takeGoogleState(cookies, url)).toBeUndefined();
	});

	it('works without next', () => {
		const cookies = memoryCookies();
		writeGoogleState(cookies, url, 'abc', '');
		expect(takeGoogleState(cookies, url)).toEqual({ state: 'abc', next: '' });
	});

	it('compares states exactly', () => {
		expect(sameState('abc', 'abc')).toBe(true);
		expect(sameState('abc', 'abd')).toBe(false);
		expect(sameState('abc', 'ab')).toBe(false);
		expect(sameState('', '')).toBe(false);
	});

	it('sends Google back to this site, at the path the console already lists', () => {
		expect(googleRedirectUri(url)).toBe('https://kheprios.com/auth/google/callback');
	});
});
