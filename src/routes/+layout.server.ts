import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const user = locals.session?.user;
	return {
		locale: locals.locale,
		appearance: locals.appearance,
		user: user ? { id: user.id, email: user.email, displayName: user.displayName, needsOnboarding: user.needsOnboarding } : null
	};
};
