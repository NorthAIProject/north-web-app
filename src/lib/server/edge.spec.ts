import { describe, expect, it } from 'vitest';
import { isGoPath, staleHtmxPage, toHttps } from './edge';

describe('isGoPath', () => {
	it('sends Go-owned paths to Go', () => {
		for (const p of [
			'/api/v1',
			'/api/v1/me',
			'/mcp',
			'/oauth/token',
			'/oauth/register',
			'/oauth/revoke',
			'/.well-known/oauth-authorization-server',
			'/.well-known/oauth-protected-resource/mcp',
			'/.well-known/acme-challenge/Xb3k9',
			'/ingest/health/batch',
			'/webhooks/telegram',
			'/healthz',
			'/internal/metrics'
		]) {
			expect(isGoPath(p), p).toBe(true);
		}
	});

	it('keeps SvelteKit paths, including the near neighbours', () => {
		for (const p of [
			'/',
			'/app',
			'/api/me',
			'/api/crews/1/live',
			'/oauth/authorize',
			'/oauth/authorize/resume',
			'/.well-known/apple-app-site-association',
			'/login',
			'/mcpx',
			'/healthzz'
		]) {
			expect(isGoPath(p), p).toBe(false);
		}
	});
});

describe('staleHtmxPage', () => {
	it('tells a Go page polling an htmx partial to reload', () => {
		const res = staleHtmxPage(
			new Request('https://kheprios.com/app/nudges/bell', { headers: { 'HX-Request': 'true' } })
		);
		expect(res?.status).toBe(200);
		expect(res?.headers.get('HX-Refresh')).toBe('true');
	});

	it('leaves every other request alone', () => {
		expect(staleHtmxPage(new Request('https://kheprios.com/app'))).toBeUndefined();
	});
});

describe('toHttps', () => {
	it('moves plain http to https, keeping path and query', () => {
		const res = toHttps(new URL('http://kheprios.com/auth/google?next=%2Fapp'));
		expect(res?.status).toBe(308);
		expect(res?.headers.get('Location')).toBe('https://kheprios.com/auth/google?next=%2Fapp');
	});

	it('leaves https and local development alone', () => {
		expect(toHttps(new URL('https://kheprios.com/login'))).toBeUndefined();
		expect(toHttps(new URL('http://localhost:5173/login'))).toBeUndefined();
		expect(toHttps(new URL('http://127.0.0.1:8787/login'))).toBeUndefined();
	});
});
