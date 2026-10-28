import type { Handle } from '@sveltejs/kit/hooks';
import { createApi } from '#lib/api/client.js';
import { isApiError } from '#lib/api/errors.js';
import { isLocale, negotiate } from '#lib/i18n/locales.js';
import { defaultAppearance, isAppearance } from '#lib/theme.js';
import { apiBaseUrl, goOrigin } from '#lib/server/config.js';
import { isGoPath, toGo } from '#lib/server/edge.js';
import { clearSession, readSession } from '#lib/server/session.js';
import { readAppearanceCookie, readLocaleCookie } from '#lib/server/preferences.js';

// Resolves who is asking, in what language, and in which appearance — the
// work north-client's LoadUser, Locale and Appearance middleware did for the
// Go pages. The account's own settings win over a visitor's cookies, which
// win over the browser's Accept-Language.
export const handle: Handle = async ({ event, resolve }) => {
	// Paths north-client still owns go straight to it, untouched (edge.ts).
	const origin = goOrigin();
	if (origin && isGoPath(event.url.pathname)) return toGo(event.request, origin);

	const token = readSession(event.cookies);
	const proxied = event.url.pathname.startsWith('/api/');

	if (token) {
		event.locals.session = { token };
		// The proxy only forwards the bearer; it has no use for the account,
		// and a /me per proxied request would double every API call.
		if (!proxied) {
			try {
				const { data } = await createApi({ fetch: event.fetch, baseUrl: apiBaseUrl(), token }).GET('/me');
				event.locals.session.user = data?.user;
			} catch (err) {
				if (isApiError(err) && err.kind === 'authentication') {
					// Expired or revoked: forget it, and the page renders signed out.
					clearSession(event.cookies, event.url);
					event.locals.session = undefined;
				} else {
					throw err;
				}
			}
		}
	}

	const user = event.locals.session?.user;
	event.locals.locale = isLocale(user?.locale)
		? user.locale
		: (readLocaleCookie(event.cookies) ?? negotiate(event.request.headers.get('accept-language')));
	event.locals.appearance = isAppearance(user?.appearance)
		? user.appearance
		: (readAppearanceCookie(event.cookies) ?? defaultAppearance);

	const appearance = event.locals.appearance;
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace('%lang%', event.locals.locale)
				.replace('%htmlclass%', appearance === 'dark' ? 'h-full dark' : 'h-full')
				.replace('%appearance%', appearance)
	});
};
