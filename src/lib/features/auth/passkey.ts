// Passkeys (WebAuthn) for the sign-in, sign-up and consent pages: a port of
// north-client's web/assets/js/auth/passkey.js.
//
// The ceremony's two "begin" calls go through the same-origin /api proxy to
// /api/v1/auth/passkey/*. "Finish" goes to this app's own /auth/passkey/finish
// endpoint instead, because finishing returns a session token and only the
// SvelteKit server may turn that into the HttpOnly session cookie — page
// JavaScript never sees the token.

export type PasskeyMode = 'login' | 'register';

/** What the API's begin routes return (PasskeyCeremonyResponse). */
export type PasskeyCeremony = { challengeId: string; publicKey: Record<string, unknown> };

/** The body this app's /auth/passkey/finish endpoint takes. */
export type PasskeyFinishBody = {
	mode: PasskeyMode;
	challengeId: string;
	credential: PublicKeyCredentialJSONish;
	next?: string;
};

export type PublicKeyCredentialJSONish = {
	id: string;
	rawId: string;
	type: string;
	response: Record<string, string | string[] | null | undefined>;
	clientExtensionResults: Record<string, unknown>;
};

export class PasskeyError extends Error {
	readonly fields: Record<string, string>;
	readonly status: number;
	constructor(message: string, status = 0, fields: Record<string, string> = {}) {
		super(message);
		this.name = 'PasskeyError';
		this.status = status;
		this.fields = fields;
	}
}

export function bufferToBase64url(buf: ArrayBuffer | ArrayBufferView): string {
	const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
	let str = '';
	for (const b of bytes) str += String.fromCharCode(b);
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlToBuffer(value: string): ArrayBuffer {
	const pad = '='.repeat((4 - (value.length % 4)) % 4);
	const str = atob((value + pad).replace(/-/g, '+').replace(/_/g, '/'));
	const bytes = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
	return bytes.buffer;
}

type Descriptor = { id: string } & Record<string, unknown>;

/** The server's JSON options with every binary field decoded for the browser API. */
export function preparePublicKeyOptions(publicKey: Record<string, unknown>): Record<string, unknown> {
	const opts: Record<string, unknown> = { ...publicKey };
	opts.challenge = base64urlToBuffer(publicKey.challenge as string);
	const user = publicKey.user as { id?: string } | undefined;
	if (user?.id) opts.user = { ...user, id: base64urlToBuffer(user.id) };
	for (const key of ['excludeCredentials', 'allowCredentials'] as const) {
		const list = publicKey[key] as Descriptor[] | undefined;
		if (list) opts[key] = list.map((c) => ({ ...c, id: base64urlToBuffer(c.id) }));
	}
	return opts;
}

type CredentialLike = {
	id: string;
	rawId: ArrayBuffer;
	type: string;
	response: {
		clientDataJSON: ArrayBuffer;
		attestationObject?: ArrayBuffer;
		getTransports?: () => string[];
		authenticatorData?: ArrayBuffer;
		signature?: ArrayBuffer;
		userHandle?: ArrayBuffer | null;
	};
	getClientExtensionResults?: () => Record<string, unknown>;
};

/** The device's credential as the browser's PublicKeyCredential JSON (base64url fields). */
export function credentialToJSON(cred: CredentialLike): PublicKeyCredentialJSONish {
	const r = cred.response;
	const out: PublicKeyCredentialJSONish = {
		id: cred.id,
		rawId: bufferToBase64url(cred.rawId),
		type: cred.type,
		response: {},
		clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {}
	};
	if (r.attestationObject) {
		out.response = {
			clientDataJSON: bufferToBase64url(r.clientDataJSON),
			attestationObject: bufferToBase64url(r.attestationObject),
			transports: typeof r.getTransports === 'function' ? r.getTransports() : undefined
		};
	} else {
		out.response = {
			clientDataJSON: bufferToBase64url(r.clientDataJSON),
			authenticatorData: bufferToBase64url(r.authenticatorData!),
			signature: bufferToBase64url(r.signature!),
			userHandle: r.userHandle ? bufferToBase64url(r.userHandle) : null
		};
	}
	return out;
}

export function passkeysSupported(): boolean {
	return typeof window !== 'undefined' && 'PublicKeyCredential' in window && !!navigator.credentials;
}

async function postJSON<T>(fetchImpl: typeof fetch, path: string, body: unknown): Promise<T> {
	const res = await fetchImpl(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json', accept: 'application/json' },
		credentials: 'same-origin',
		body: JSON.stringify(body ?? {})
	});
	let data: { error?: { message?: string; fields?: Record<string, string> } | string } & Record<string, unknown> = {};
	try {
		data = await res.json();
	} catch {
		/* empty body */
	}
	if (!res.ok) {
		const detail = typeof data.error === 'string' ? { message: data.error } : data.error;
		throw new PasskeyError(detail?.message || res.statusText || 'Request failed', res.status, detail?.fields ?? {});
	}
	return data as T;
}

export type PasskeyRun = {
	mode: PasskeyMode;
	email?: string;
	displayName?: string;
	timezone?: string;
	next?: string;
	fetch?: typeof fetch;
	credentials?: Pick<CredentialsContainer, 'create' | 'get'>;
};

/**
 * Runs a whole ceremony and returns where to go next. The session cookie is
 * already set when this resolves: the finish endpoint set it.
 */
export async function runPasskey(run: PasskeyRun): Promise<string> {
	const fetchImpl = run.fetch ?? fetch;
	const creds = run.credentials ?? navigator.credentials;
	const email = (run.email ?? '').trim();

	let begin: PasskeyCeremony;
	if (run.mode === 'register') {
		const displayName = (run.displayName ?? '').trim();
		if (!email || !displayName) throw new PasskeyError('Enter your name and email before creating a passkey.');
		begin = await postJSON(fetchImpl, '/api/auth/passkey/register/begin', {
			email,
			displayName,
			timezone: run.timezone ?? ''
		});
	} else {
		begin = await postJSON(fetchImpl, '/api/auth/passkey/login/begin', email ? { email } : {});
	}

	const publicKey = preparePublicKeyOptions(begin.publicKey);
	const cred =
		run.mode === 'register'
			? await creds.create({ publicKey } as unknown as CredentialCreationOptions)
			: await creds.get({ publicKey } as unknown as CredentialRequestOptions);
	if (!cred) throw new PasskeyError('Passkey was cancelled.');

	const finish = await postJSON<{ redirect?: string }>(fetchImpl, '/auth/passkey/finish', {
		mode: run.mode,
		challengeId: begin.challengeId,
		credential: credentialToJSON(cred as unknown as CredentialLike),
		next: run.next
	} satisfies PasskeyFinishBody);
	return finish.redirect || '/app';
}

/** The message to show for a failed ceremony (passkey.js's catch). */
export function passkeyErrorMessage(err: unknown): string {
	if (err && typeof err === 'object' && (err as { name?: string }).name === 'NotAllowedError') return 'Passkey was cancelled.';
	if (err instanceof Error && err.message) return err.message;
	return 'Passkey failed. Please try again.';
}
