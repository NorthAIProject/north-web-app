import { describe, expect, it } from 'vitest';
import { createApi } from '#lib/api/client.js';
import { clientAddress } from './api';

describe('clientAddress', () => {
	it('is the address SvelteKit reports', () => {
		expect(clientAddress({ getClientAddress: () => '176.223.17.241' })).toBe('176.223.17.241');
	});

	it('is undefined when the event has none', () => {
		expect(clientAddress({})).toBeUndefined();
		expect(
			clientAddress({
				getClientAddress: () => {
					throw new Error('no address while prerendering');
				}
			})
		).toBeUndefined();
	});
});

describe('createApi', () => {
	it('sends the browser address as X-Real-IP', async () => {
		let seen: Headers | undefined;
		const fetch = (async (input: Request) => {
			seen = input.headers;
			return new Response('{}', { headers: { 'content-type': 'application/json' } });
		}) as typeof globalThis.fetch;
		await createApi({ fetch, baseUrl: 'http://api.test', clientAddress: '176.223.17.241' }).GET(
			'/me'
		);
		expect(seen?.get('x-real-ip')).toBe('176.223.17.241');
	});
});
