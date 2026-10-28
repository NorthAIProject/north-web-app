import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: settings.showActivity — what North has done on this person's behalf.
export const load: PageServerLoad = async (event) => {
	const { data } = await serverApi(event).GET('/settings/activity');
	return { executions: data!.executions };
};
