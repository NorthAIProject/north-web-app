import { describe, expect, it, vi } from 'vitest';
import {
	base64urlToBuffer,
	bufferToBase64url,
	credentialToJSON,
	passkeyErrorMessage,
	preparePublicKeyOptions,
	runPasskey
} from './passkey';
import { googleHref } from './options';

const bytes = (...b: number[]) => new Uint8Array(b).buffer;

describe('base64url', () => {
	it('round-trips without padding or +/', () => {
		const buf = bytes(251, 255, 191, 0, 1);
		const encoded = bufferToBase64url(buf);
		expect(encoded).not.toMatch(/[+/=]/);
		expect(new Uint8Array(base64urlToBuffer(encoded))).toEqual(new Uint8Array(buf));
	});
});

describe('preparePublicKeyOptions', () => {
	it('decodes the challenge, user id and credential ids', () => {
		const opts = preparePublicKeyOptions({
			challenge: 'AQID',
			rpId: 'kheprios.com',
			user: { id: 'BAU', name: 'ana' },
			allowCredentials: [{ id: 'Bgc', type: 'public-key' }]
		});
		expect(new Uint8Array(opts.challenge as ArrayBuffer)).toEqual(new Uint8Array([1, 2, 3]));
		expect(new Uint8Array((opts.user as { id: ArrayBuffer }).id)).toEqual(new Uint8Array([4, 5]));
		const allow = opts.allowCredentials as { id: ArrayBuffer; type: string }[];
		expect(new Uint8Array(allow[0].id)).toEqual(new Uint8Array([6, 7]));
		expect(allow[0].type).toBe('public-key');
		expect(opts.rpId).toBe('kheprios.com');
	});
});

describe('credentialToJSON', () => {
	it('encodes an attestation (register)', () => {
		const json = credentialToJSON({
			id: 'cred',
			rawId: bytes(1),
			type: 'public-key',
			response: { clientDataJSON: bytes(2), attestationObject: bytes(3), getTransports: () => ['internal'] }
		});
		expect(json.response).toEqual({ clientDataJSON: 'Ag', attestationObject: 'Aw', transports: ['internal'] });
		expect(json.rawId).toBe('AQ');
	});

	it('encodes an assertion (login)', () => {
		const json = credentialToJSON({
			id: 'cred',
			rawId: bytes(1),
			type: 'public-key',
			response: { clientDataJSON: bytes(2), authenticatorData: bytes(3), signature: bytes(4), userHandle: null }
		});
		expect(json.response).toEqual({ clientDataJSON: 'Ag', authenticatorData: 'Aw', signature: 'BA', userHandle: null });
	});
});

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('runPasskey', () => {
	const assertion = {
		id: 'cred',
		rawId: bytes(1),
		type: 'public-key',
		response: { clientDataJSON: bytes(2), authenticatorData: bytes(3), signature: bytes(4), userHandle: bytes(5) }
	};

	it('begins through the /api proxy and finishes through this server, never seeing a token', async () => {
		const calls: { url: string; body: Record<string, unknown> }[] = [];
		const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
			if (String(url).startsWith('/api/')) return jsonResponse({ challengeId: 'c1', publicKey: { challenge: 'AQ' } });
			return jsonResponse({ redirect: '/app/goals' });
		});
		const credentials = { get: vi.fn(async () => assertion), create: vi.fn() };

		const destination = await runPasskey({
			mode: 'login',
			email: ' ana@example.com ',
			next: '/app/goals',
			fetch: fetchImpl as unknown as typeof fetch,
			credentials: credentials as unknown as CredentialsContainer
		});

		expect(destination).toBe('/app/goals');
		expect(calls[0]).toEqual({ url: '/api/auth/passkey/login/begin', body: { email: 'ana@example.com' } });
		expect(calls[1].url).toBe('/auth/passkey/finish');
		expect(calls[1].body).toMatchObject({ mode: 'login', challengeId: 'c1', next: '/app/goals' });
		expect(credentials.create).not.toHaveBeenCalled();
	});

	it('asks for a name and email before registering', async () => {
		const fetchImpl = vi.fn();
		await expect(runPasskey({ mode: 'register', email: 'a@b.c', fetch: fetchImpl as unknown as typeof fetch })).rejects.toThrow(
			/name and email/
		);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('surfaces the API error message', async () => {
		const fetchImpl = vi.fn(async () => jsonResponse({ error: { message: 'Passkeys are off.' } }, 404));
		await expect(runPasskey({ mode: 'login', fetch: fetchImpl as unknown as typeof fetch })).rejects.toThrow(
			'Passkeys are off.'
		);
	});
});

describe('messages and links', () => {
	it('maps a cancelled ceremony', () => {
		expect(passkeyErrorMessage({ name: 'NotAllowedError' })).toBe('Passkey was cancelled.');
		expect(passkeyErrorMessage(new Error('boom'))).toBe('boom');
		expect(passkeyErrorMessage(undefined)).toBe('Passkey failed. Please try again.');
	});

	it('carries next to Google', () => {
		expect(googleHref('')).toBe('/auth/google');
		expect(googleHref('/oauth/authorize/resume?request_id=1')).toBe(
			'/auth/google?next=%2Foauth%2Fauthorize%2Fresume%3Frequest_id%3D1'
		);
	});
});
