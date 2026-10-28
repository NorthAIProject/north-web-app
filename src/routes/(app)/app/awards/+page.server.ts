import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: internal/awards/handler.go own (GET /app/awards), the caller's page,
// for people without a handle too.
export const load: PageServerLoad = async (event) => {
	event.depends('north:awards-page');
	const { data } = await serverApi(event).GET('/awards');
	return { awards: data! };
};
