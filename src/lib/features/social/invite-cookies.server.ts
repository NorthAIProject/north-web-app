import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { secureCookies } from '#lib/server/config.js';

// The two link cookies (Go: social.InviteCookie, crews.JoinCookie). A
// signed-out visitor to /i/<code> or /i/c/<code> carries the code through
// whichever way they then sign up or in; the first page inside /app redeems
// it and forgets it.

export const inviteCookie = 'north_invite';
export const crewCookie = 'north_crew';

/** Long enough for somebody who taps a link today and signs up at the weekend. */
const linkCookieAge = 30 * 24 * 60 * 60;

export function setLinkCookie(cookies: Cookies, url: URL, name: string, code: string) {
	cookies.set(name, code, {
		path: '/',
		maxAge: linkCookieAge,
		httpOnly: true,
		secure: secureCookies(url),
		sameSite: 'lax'
	});
}

/**
 * Go: socialHandler.RedeemInvite + crewHandler.JoinFromCookie, the /app
 * middleware. Connects the signed-in account to whoever's link brought them
 * and joins the crew a link named, then forgets both codes. Failures are
 * logged and never stop the page: an invite is a nicety, the app is the point.
 */
export async function redeemLinkCookies(
	event: Pick<RequestEvent, 'cookies' | 'url' | 'fetch' | 'locals'>
) {
	const { cookies, url } = event;
	const invite = cookies.get(inviteCookie);
	const crew = cookies.get(crewCookie);
	if (!invite && !crew) return;
	const api = serverApi(event);
	if (invite) {
		try {
			await api.POST('/invites/{code}/redeem', { params: { path: { code: invite } } });
		} catch (err) {
			console.warn('could not redeem invite', err);
		}
		cookies.delete(inviteCookie, { path: '/', secure: secureCookies(url) });
	}
	if (crew) {
		try {
			await api.POST('/crews/join/{code}', { params: { path: { code: crew } } });
		} catch (err) {
			console.warn('could not join crew from link', err);
		}
		cookies.delete(crewCookie, { path: '/', secure: secureCookies(url) });
	}
}
