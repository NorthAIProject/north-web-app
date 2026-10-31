import { describe, expect, it } from 'vitest';
import { autocaptureAllowlist, keepsQuery, pathOf, sanitize, shouldRecord } from './analytics';

// The decisions north-client's web/shared/analytics tests, carried over.
describe('analytics decisions', () => {
	it('normalises a page path', () => {
		expect(pathOf('/?utm_source=x')).toBe('/');
		expect(pathOf('/privacy/')).toBe('/privacy');
		expect(pathOf('')).toBe('/');
	});

	it('records only the landing page and the agent consent screen', () => {
		expect(shouldRecord('/')).toBe(true);
		expect(shouldRecord('/oauth/authorize')).toBe(true);
		expect(shouldRecord('/app')).toBe(false);
		expect(shouldRecord('/login')).toBe(false);
	});

	it('keeps the query only on the landing page', () => {
		expect(keepsQuery('/')).toBe(true);
		expect(keepsQuery('/reset-password')).toBe(false);
		const props = { $current_url: 'https://kheprios.com/reset-password?token=secret', other: 'a?b' };
		expect(sanitize(props, false)).toEqual({ $current_url: 'https://kheprios.com/reset-password', other: 'a?b' });
	});

	it('autocaptures on the fixed public set, never inside /app or on reset links', () => {
		const allow = autocaptureAllowlist().map((r) => new RegExp(r));
		const ok = (url: string) => allow.some((r) => r.test(url));
		expect(ok('https://kheprios.com/')).toBe(true);
		expect(ok('https://kheprios.com/?utm_source=x')).toBe(true);
		expect(ok('https://kheprios.com/signup')).toBe(true);
		expect(ok('https://kheprios.com/app')).toBe(false);
		expect(ok('https://kheprios.com/reset-password?token=t')).toBe(false);
		expect(ok('https://kheprios.com/privacy-extra')).toBe(false);
	});
});

describe('vendored posthog files', () => {
	it('name files that exist, with the version in the name', async () => {
		const { existsSync } = await import('node:fs');
		const { posthogScript, recorderScript } = await import('./analytics');
		for (const src of [posthogScript, recorderScript]) {
			expect(src).toMatch(/^\/assets\/js\/vendor\/posthog-[a-z-]+-\d+\.\d+\.\d+\.js$/);
			expect(existsSync(`static${src}`)).toBe(true);
		}
	});
});
