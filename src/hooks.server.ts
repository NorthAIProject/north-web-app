import type { Handle } from '@sveltejs/kit/hooks';
import { createApi } from '#lib/api/client.js';
import { isApiError } from '#lib/api/errors.js';
import { isLocale, negotiate } from '#lib/i18n/locales.js';
import { defaultAppearance, isAppearance } from '#lib/theme.js';
import { apiBaseUrl, goOrigin } from '#lib/server/config.js';
import { isGoPath, staleHtmxPage, toGo, toHttps } from '#lib/server/edge.js';
import { clearSession, readSession } from '#lib/server/session.js';
import { readAppearanceCookie, readLocaleCookie } from '#lib/server/preferences.js';

// Resolves who is asking, in what language, and in which appearance — the
// work north-client's LoadUser, Locale and Appearance middleware did for the
// Go pages. The account's own settings win over a visitor's cookies, which
// win over the browser's Accept-Language.
export const handle: Handle = async ({ event, resolve }) => {
	const secure = toHttps(event.url);
	if (secure) return secure;

	// Paths north-client still owns go straight to it, untouched (edge.ts).
	const origin = goOrigin();
	if (origin && isGoPath(event.url.pathname)) return toGo(event.request, origin);
	const reload = staleHtmxPage(event.request);
	if (reload) return reload;

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
	const lean = isPublicPage(event.route.id);
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace('%lang%', event.locals.locale)
				.replace('%htmlclass%', appearance === 'dark' ? 'h-full dark' : 'h-full')
				.replace('%appearance%', appearance)
				.replace('%monopreload%', lean ? '' : monoPreload),
		preload: lean ? leanPreload : undefined
	});
};

// The signed-out pages (landing, sign-in, legal) are where a first visit on a
// slow phone lands. By default SvelteKit puts a modulepreload in the head for
// every chunk the page will hydrate with — 77 on the landing page — and on a
// thin connection they share the line with the one render-blocking stylesheet
// and push the first paint back. There the head carries the stylesheet, fonts
// and the two entry chunks; the rest of the JavaScript is fetched as the entry
// imports it, after the page is already on screen.
function isPublicPage(routeId: string | null): boolean {
	return routeId?.startsWith('/(public)') ?? false;
}

function leanPreload({ type, path }: { type: 'js' | 'css' | 'font' | 'asset'; path: string }): boolean {
	return type === 'css' || type === 'font' || (type === 'js' && path.includes('/immutable/entry/'));
}

// Geist Mono is the app's figures and labels; the public pages can let it
// arrive late (font-display: optional falls back for that one visit).
const monoPreload =
	'<link rel="preload" href="/assets/fonts/geist/geist-mono-variable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />';
