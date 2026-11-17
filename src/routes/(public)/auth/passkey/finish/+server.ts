import { isApiError } from '#lib/api/errors.js';
import { isJsonObject, type JsonObject } from '#lib/json.js';
import { serverApi } from '#lib/server/api.js';
import { safeNext } from '#lib/server/redirect.js';
import { writeSession } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

// The end of a passkey ceremony (Go: POST /auth/passkey/{login,register}/finish).
//
// The browser ran begin through the /api proxy and the device signed the
// challenge; finishing returns a session token, and that token must land in
// the HttpOnly cookie rather than in page JavaScript. So the browser posts the
// credential here, this server finishes with the API and writes the cookie,
// and the browser only learns where to go next.
//
// CSRF: a JSON body from another origin cannot be sent without a preflight
// this app never answers, and the credential is bound to this origin by the
// authenticator anyway.
export const POST: RequestHandler = async (event) => {
	// mode, challengeId, credential and next, none of them checked yet. A body
	// that is JSON but not an object has none of them, and the API refuses it.
	let body: JsonObject;
	try {
		const parsed: unknown = await event.request.json();
		body = isJsonObject(parsed) ? parsed : {};
	} catch {
		return Response.json({ error: { message: 'The request body must be JSON.' } }, { status: 400 });
	}

	const api = serverApi(event);
	const finish = {
		body: { challengeId: typeof body.challengeId === 'string' ? body.challengeId : '', credential: (body.credential ?? {}) as Record<string, never> }
	};
	try {
		const { data } =
			body.mode === 'register'
				? await api.POST('/auth/passkey/register/finish', finish)
				: await api.POST('/auth/passkey/login/finish', finish);
		writeSession(event.cookies, event.url, data!.token, data!.expiresAt);
	} catch (err) {
		if (isApiError(err)) {
			return Response.json({ error: { message: err.message, fields: err.fields } }, { status: err.status });
		}
		throw err;
	}
	return Response.json({ redirect: safeNext(typeof body.next === 'string' ? body.next : null, '/app') });
};
