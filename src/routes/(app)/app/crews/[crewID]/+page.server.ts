import { loadSpace, spaceActions } from '#lib/features/crews/space.server.js';
import type { Actions, PageServerLoad } from './$types';

// Go: crews.Handler.space (GET /app/crews/{id}): the default channel's chat.
export const load: PageServerLoad = (event) => loadSpace(event, event.params.crewID, '', 'chat');

export const actions: Actions = spaceActions((event) => event.params.crewID!);
