import { loadSpace, spaceActions } from '#lib/features/crews/space.server.js';
import type { Actions, PageServerLoad } from './$types';

// Go: crews.Handler.channelPage (GET /app/crews/{id}/c/{channelID}).
export const load: PageServerLoad = (event) => loadSpace(event, event.params.crewID, event.params.channelID, 'chat');

export const actions: Actions = spaceActions((event) => event.params.crewID!);
