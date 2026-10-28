import { serverApi } from '#lib/server/api.js';
import { PREVIOUS_LIMIT } from '#lib/features/formcheck/view.js';
import type { PageServerLoad } from './$types';

// Go: internal/media/handler.go index (GET /app/form). The upload (POST
// /app/form) goes from the browser through the /api proxy; see the page.
export const load: PageServerLoad = async (event) => {
	event.depends('north:formcheck');
	const { data } = await serverApi(event).GET('/form-checks');
	return { checks: (data?.checks ?? []).slice(0, PREVIOUS_LIMIT) };
};
