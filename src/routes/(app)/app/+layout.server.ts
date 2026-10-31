import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { redeemLinkCookies } from '#lib/features/social/invite-cookies.server.js';
import type { LayoutServerLoad } from './$types';

// Everything under /app needs a session (Go: authMW.RequireAuth), and an
// account that has not finished onboarding sees nothing but onboarding (Go:
// onboarding.RequireOnboarded).
//
// This load runs once per visit to /app, not on every navigation inside it:
// only an account still in onboarding reads the URL (which makes SvelteKit
// re-run the load whenever the URL changes, so the redirect holds on every
// page). Whatever ends the first week calls invalidate('north:first-week').
export const load: LayoutServerLoad = async (event) => {
	const { locals } = event;
	const user = locals.session?.user;
	if (!user) {
		const next = event.untrack(() => event.url.pathname + event.url.search);
		redirect(303, `/login?next=${encodeURIComponent(next)}`);
	}

	// Social slice (Go: socialHandler.RedeemInvite + crewHandler.JoinFromCookie,
	// right after RequireAuth and before RequireOnboarded): a code carried from
	// /i/<code> or /i/c/<code> is redeemed on the first signed-in page, then its
	// cookie is dropped. Never fails the page.
	await redeemLinkCookies(event);

	if (user.needsOnboarding) {
		if (!event.url.pathname.startsWith('/app/onboarding')) redirect(303, '/app/onboarding');
	}

	event.depends('north:first-week');
	return {
		user: { id: user.id, email: user.email, displayName: user.displayName, timezone: user.timezone },
		// Onboarding renders bare (no rail), so it never needs the lookup.
		simpleNav: user.needsOnboarding ? false : await inFirstWeek(event)
	};
};

/** A running first week shows a smaller rail (Go: firstweek.SimpleNav). */
async function inFirstWeek(event: Parameters<LayoutServerLoad>[0]): Promise<boolean> {
	try {
		const { data } = await serverApi(event).GET('/first-week');
		return data?.status === 'active' && data.day <= data.totalDays;
	} catch {
		// The rail is chrome: a failed lookup shows the full one rather than no page.
		return false;
	}
}
