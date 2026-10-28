import { error } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { orNotFound } from '#lib/features/profiles/load.js';
import type { PageServerLoad } from './$types';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Go: internal/profiles/handler.go workout (GET /app/u/{handle}/workouts/{sessionID}).
export const load: PageServerLoad = async (event) => {
	const { handle, sessionID } = event.params;
	if (!uuidPattern.test(sessionID)) error(404, 'Not found.');
	const api = serverApi(event);
	const [card, profile] = await Promise.all([
		orNotFound(api.GET('/profiles/{handle}/workouts/{sessionID}', { params: { path: { handle, sessionID } } })),
		orNotFound(api.GET('/profiles/{handle}', { params: { path: { handle } } }))
	]);
	return { card: card.data!, profile: profile.data! };
};
