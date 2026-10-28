import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import type { LayoutServerLoad } from './$types';

// Everything under /app needs a session (Go: authMW.RequireAuth), and an
// account that has not finished onboarding sees nothing but onboarding (Go:
// onboarding.RequireOnboarded).
export const load: LayoutServerLoad = async (event) => {
	const { locals, url } = event;
	const user = locals.session?.user;
	if (!user) redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);

	const onboarding = url.pathname.startsWith('/app/onboarding');
	if (user.needsOnboarding && !onboarding) redirect(303, '/app/onboarding');

	return {
		user: { id: user.id, email: user.email, displayName: user.displayName, timezone: user.timezone },
		simpleNav: onboarding ? false : await inFirstWeek(event)
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
