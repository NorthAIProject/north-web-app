// The small text helpers the Friends page's templ (north-client
// web/social/social.templ, finding.templ) defined in Go, with the same keys.
import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

/** Up to two upper-case initials, "?" for an empty name (Go: initials). */
export function initials(name: string): string {
	let out = '';
	for (const f of name.split(/\s+/).filter(Boolean)) {
		if (out.length === 2) break;
		out += String.fromCodePoint(f.codePointAt(0)!).toUpperCase();
	}
	return out || '?';
}

/** "@handle", or the no-handle text (Go: at). */
export function at(i18n: Translator, handle: string): string {
	return handle ? '@' + handle : i18n.t('social.nohandle');
}

/** The person's profile, empty when they have no handle to build it from. */
export function profileHref(handle: string): string {
	return handle ? '/app/u/' + encodeURIComponent(handle) : '';
}

/**
 * How long ago, as the feed shows it (Go: ago). now is the server's clock at
 * load, so the server render and hydration agree.
 */
export function ago(i18n: Translator, t: string, now: number, timeZone?: string): string {
	const d = now - new Date(t).getTime();
	const hour = 3_600_000;
	if (d < hour) return i18n.tf('social.ago.minutes', Math.max(1, Math.floor(d / 60_000)));
	if (d < 24 * hour) return i18n.tf('social.ago.hours', Math.floor(d / hour));
	if (d < 7 * 24 * hour) return i18n.tf('social.ago.days', Math.floor(d / (24 * hour)));
	return formatTime(i18n.locale, t, '2 Jan', timeZone);
}

/** "1 kudos" / "%d kudos" on your own moment (Go: kudosCount). */
export function kudosCount(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('social.feed.kudos.one') : i18n.tf('social.feed.kudos', n);
}

/** "1 person found" / "%d people found" under Facebook matches (Go: peopleFound). */
export function peopleFound(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('social.fb.found.one') : i18n.tf('social.fb.found.many', n);
}

/**
 * The short, upper-case month a monthly coin carries, from "YYYY-MM"
 * (Go: award.MonthlyCoinMonth). The month is a calendar month: UTC keeps it.
 */
export function coinMonth(locale: string, key: string): string {
	if (!/^\d{4}-\d{2}$/.test(key)) return '';
	return formatTime(locale, `${key}-15T12:00:00Z`, 'Jan', 'UTC').toUpperCase();
}

/** The country in the reader's language, else the English name (Go: countryName). */
export function countryName(i18n: Translator, c: { dial: string; name: string }): string {
	const key = 'social.country.' + c.dial;
	return i18n.has(key) ? i18n.t(key) : c.name;
}

const facebookResults = ['connected', 'cancelled', 'expired', 'taken', 'failed'];

/** The alert after a Facebook connection, empty for anything else (Go: facebookNotice). */
export function facebookNotice(i18n: Translator, result: string): string {
	return facebookResults.includes(result) ? i18n.t('social.fb.notice.' + result) : '';
}

/** connected and cancelled are news; the rest went wrong (Go: facebookNoticeVariant). */
export function facebookNoticeVariant(result: string): 'default' | 'destructive' {
	return result === 'connected' || result === 'cancelled' ? 'default' : 'destructive';
}

/** The author's page for a feed workout; empty without a handle (Go: workoutHref). */
export function workoutHref(handle: string, sessionId?: string): string {
	if (!handle || !sessionId) return '';
	return '/app/u/' + handle + '/workouts/' + sessionId;
}
