import { EMBLEM_3D_MODEL_URL } from '$app/env/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const user = locals.session?.user;
	return {
		locale: locals.locale,
		appearance: locals.appearance,
		// The 3D emblem experiment (ADR 0005): set on the beta Worker only.
		emblem3dModel: EMBLEM_3D_MODEL_URL || null,
		user: user ? { id: user.id, email: user.email, displayName: user.displayName, needsOnboarding: user.needsOnboarding } : null
	};
};
