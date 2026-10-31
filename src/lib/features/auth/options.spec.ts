import { describe, expect, it } from 'vitest';
import type { Api } from '#lib/api/client.js';
import {
	fetchAuthOptions,
	fetchAuthOptionsOrUnknown,
	noAuthOptions,
	passwordResetOffered
} from './options';

// Only GET is called; a stub stands in for the typed client.
const api = (get: () => Promise<{ data?: unknown }>) => ({ GET: get }) as unknown as Api;
const on = { google: true, passkey: false, passwordReset: true };
const off = { google: false, passkey: false, passwordReset: false };

describe('auth options', () => {
	it('reads the options when the API answers', async () => {
		expect(await fetchAuthOptionsOrUnknown(api(async () => ({ data: on })))).toEqual(on);
	});

	it('is unknown, not "off", when the API throws or says nothing', async () => {
		const down = api(async () => {
			throw new Error('connection refused');
		});
		expect(await fetchAuthOptionsOrUnknown(down)).toBeNull();
		expect(await fetchAuthOptionsOrUnknown(api(async () => ({})))).toBeNull();
		// The sign-in pages still read "unknown" as every optional method off.
		expect(await fetchAuthOptions(down)).toEqual(noAuthOptions);
	});

	it('hides password reset only when the API says it is off', () => {
		expect(passwordResetOffered(on)).toBe(true);
		expect(passwordResetOffered(off)).toBe(false);
		expect(passwordResetOffered(null)).toBe(true);
	});
});
