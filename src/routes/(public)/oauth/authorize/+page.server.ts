import { error, fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import {
	clearOAuthVerifier,
	frameGuardHeaders,
	readOAuthVerifier,
	resumePath,
	writeOAuthVerifier
} from '#lib/server/oauth.js';
import { writeSession } from '#lib/server/session.js';
import { fetchAuthOptions } from '#lib/features/auth/options.js';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

// GET /oauth/authorize (Go: mcpauth.BrowserHandler.authorize and
// renderExisting). An agent's browser redirect lands here with the OAuth
// query; the request is parked in north-client and this page re-renders from
// its id from then on. Deliberate difference from Go: after parking, the
// browser is redirected to ?request_id=…, so a reload or a form post never
// parks a second request.
export const load: PageServerLoad = async (event) => {
	const { url, cookies, locals, setHeaders } = event;
	setHeaders(frameGuardHeaders);
	const api = serverApi(event);

	const requestId = url.searchParams.get('request_id');
	if (!requestId) {
		const q = (name: string) => url.searchParams.get(name) ?? '';
		let begun;
		try {
			({ data: begun } = await api.POST('/auth/oauth/authorize', {
				body: {
					clientId: q('client_id'),
					redirectUri: q('redirect_uri'),
					responseType: q('response_type'),
					state: q('state'),
					scope: q('scope'),
					codeChallenge: q('code_challenge'),
					codeChallengeMethod: q('code_challenge_method'),
					resource: q('resource'),
					signedIn: Boolean(locals.session?.user)
				}
			}));
		} catch (err) {
			// Fatal: the destination is unvalidated, so show the reason, never redirect.
			if (isApiError(err) && err.status < 500) error(400, err.message);
			throw err;
		}
		// The client's own registered callback, validated by north-client.
		if (begun?.redirect) redirect(303, begun.redirect, { external: true });
		writeOAuthVerifier(cookies, url, begun!.verifier!);
		redirect(303, `/oauth/authorize?request_id=${encodeURIComponent(begun!.request!.id)}`);
	}

	const request = await loadRequest(event, requestId);
	return {
		request,
		mode: url.searchParams.get('mode') === 'login' ? ('login' as const) : ('signup' as const),
		email: locals.session?.user?.email ?? '',
		authOptions: await fetchAuthOptions(api),
		resume: resumePath(request.id)
	};
};

async function loadRequest(event: Pick<RequestEvent, 'fetch' | 'locals' | 'cookies'>, requestId: string) {
	try {
		const { data } = await serverApi(event).GET('/auth/oauth/requests/{requestID}', {
			params: {
				path: { requestID: requestId },
				header: { 'X-OAuth-Request-Verifier': readOAuthVerifier(event.cookies) }
			}
		});
		return data!;
	} catch (err) {
		// Unknown id, wrong browser, or expired: the one "expired" page.
		if (isApiError(err) && err.status < 500) error(400, err.message);
		throw err;
	}
}

export const actions: Actions = {
	// POST /oauth/authorize/account (Go: BrowserHandler.account): create the
	// account or sign in without leaving the screen, then show the signed-in
	// card with Approve still to press — never auto-approved.
	account: async (event) => {
		const { url, cookies, locals } = event;
		const requestId = url.searchParams.get('request_id') ?? '';
		const form = await event.request.formData();
		const mode = form.get('mode') === 'login' ? 'login' : 'signup';
		const values = {
			mode,
			email: String(form.get('email') ?? ''),
			display_name: String(form.get('display_name') ?? '')
		};
		try {
			const { data } = await serverApi(event).POST('/auth/oauth/requests/{requestID}/account', {
				params: { path: { requestID: requestId } },
				body: {
					verifier: readOAuthVerifier(cookies),
					mode,
					email: values.email,
					password: String(form.get('password') ?? ''),
					displayName: values.display_name,
					timezone: String(form.get('timezone') ?? '')
				}
			});
			writeSession(cookies, url, data!.token, data!.expiresAt);
			// The page re-renders in this same request without JavaScript.
			locals.session = { token: data!.token, user: data!.user };
		} catch (err) {
			if (!isApiError(err)) throw err;
			if (err.status === 404) error(400, err.message);
			const errors = err.fields ?? {};
			return fail(err.status >= 500 ? 503 : 422, {
				values,
				errors,
				error: Object.keys(errors).length ? '' : err.message
			});
		}
		return { signedIn: true };
	},

	// POST /oauth/authorize (Go: BrowserHandler.decide): Approve or Cancel.
	decide: async (event) => {
		const { url, cookies, locals } = event;
		const requestId = url.searchParams.get('request_id') ?? '';
		// The session expired while the screen was open: sign in again here.
		if (!locals.session?.user) {
			redirect(303, `/oauth/authorize?request_id=${encodeURIComponent(requestId)}&mode=login`);
		}
		const form = await event.request.formData();
		const verifier = readOAuthVerifier(cookies);
		const deny = form.get('decision') === 'deny';

		let destination: string;
		try {
			const { data } = deny
				? await serverApi(event).POST('/oauth/requests/{requestID}/deny', {
						params: { path: { requestID: requestId } },
						body: { verifier }
					})
				: await serverApi(event).POST('/oauth/requests/{requestID}/approve', {
						params: { path: { requestID: requestId } },
						// The toggle may narrow the grant; nothing posted can widen it.
						body: { verifier, readOnly: form.get('read_only') !== null }
					});
			destination = data!.redirect;
		} catch (err) {
			if (isApiError(err) && err.status < 500) error(400, err.message);
			throw err;
		}
		clearOAuthVerifier(cookies, url);
		// The client's registered callback, matched by north-client before parking.
		redirect(303, destination, { external: true });
	}
};
