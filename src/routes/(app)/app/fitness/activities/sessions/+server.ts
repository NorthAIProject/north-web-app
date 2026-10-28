import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Go: GET /app/fitness/activities/sessions served the pager's HTMX fragment.
// The page now fetches /api/fitness/activities/sessions itself; a direct visit
// lands on the whole page at the same page number.
export const GET: RequestHandler = ({ url }) => {
	const page = url.searchParams.get('page');
	redirect(
		303,
		page ? `/app/fitness/activities?page=${encodeURIComponent(page)}` : '/app/fitness/activities'
	);
};
