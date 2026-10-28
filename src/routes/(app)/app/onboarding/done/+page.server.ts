import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /app/onboarding/done?thread=… (Go: onboarding.Handler.done).
export const load: PageServerLoad = async (event) => {
	const user = event.locals.session?.user;
	if (user?.needsOnboarding) redirect(303, '/app/onboarding');
	// Parsed rather than passed through, so only a real uuid reaches the href.
	const raw = event.url.searchParams.get('thread') ?? '';
	const { data } = await serverApi(event).GET('/onboarding');
	return {
		thread: uuid.test(raw) ? raw.toLowerCase() : '',
		firstName: firstName(user?.displayName),
		// The "connect one source" step shows when a first week started.
		connect: data?.firstWeek ?? false
	};
};

/** users.User.FirstName: the first word, or "there" for an empty name. */
function firstName(displayName: string | undefined): string {
	const name = (displayName ?? '').trim();
	if (!name) return 'there';
	return name.split(' ')[0];
}
