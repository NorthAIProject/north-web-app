import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Go: redirectLegacyPlan. Do not remove: until 2026-09-07 the daily training
// nudge linked "/app/workouts/{id}", a path that never existed, and pushes
// already delivered to devices still carry it. Only a plan UUID qualifies.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = ({ params }) => {
	if (!uuid.test(params.id)) error(404, 'Not found.');
	redirect(301, `/app/training/${params.id.toLowerCase()}`);
};
