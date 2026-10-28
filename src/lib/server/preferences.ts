import type { Cookies } from '@sveltejs/kit';
import { isLocale, localeCookie, type Locale } from '#lib/i18n/locales.js';
import { isAppearance, appearanceCookie, type Appearance } from '#lib/theme.js';
import { secureCookies } from './config';

const year = 365 * 24 * 60 * 60;

export function writeLocaleCookie(cookies: Cookies, url: URL, locale: Locale | '') {
	if (!isLocale(locale)) {
		cookies.delete(localeCookie, { path: '/', secure: secureCookies(url) });
		return;
	}
	cookies.set(localeCookie, locale, { path: '/', httpOnly: true, sameSite: 'lax', secure: secureCookies(url), maxAge: year });
}

export function writeAppearanceCookie(cookies: Cookies, url: URL, appearance: Appearance) {
	cookies.set(appearanceCookie, appearance, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookies(url),
		maxAge: year
	});
}

export function readLocaleCookie(cookies: Cookies): Locale | undefined {
	const value = cookies.get(localeCookie);
	return isLocale(value) ? value : undefined;
}

export function readAppearanceCookie(cookies: Cookies): Appearance | undefined {
	const value = cookies.get(appearanceCookie);
	return isAppearance(value) ? value : undefined;
}
