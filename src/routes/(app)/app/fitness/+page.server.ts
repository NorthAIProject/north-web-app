import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: internal/fitness/handler.go hub (GET /app/fitness). The Strava routes
// under strava/ come back here with ?notice=<code>, where Go re-rendered the
// hub with the message inline.
export const load: PageServerLoad = async (event) => {
	event.depends('north:fitness');
	const { data } = await serverApi(event).GET('/fitness/hub');
	return { hub: data!, notice: event.url.searchParams.get('notice'), now: Date.now() };
};
