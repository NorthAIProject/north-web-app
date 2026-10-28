// The plan editor's writes, from the browser through the /api proxy
// (Go: the htmx edit endpoints in internal/workouts/handler.go).
//
// Every edit stores a new version of the plan and answers with it, so the id
// in the address bar changes on every edit. An edit against a superseded
// version answers 409 with the newest one, which the page shows instead (Go:
// afterEditError) so the next click is not refused the same way forever.
//
// Plain fetch rather than browserApi: the typed client throws on every
// non-2xx and drops the body, and the 409 body is the plan to show.

import { apiErrorFrom } from '#lib/api/errors.js';
import type { CatalogExercise, PlanDetail } from './types.js';

export type EditResult = { plan: PlanDetail; superseded: boolean };

async function send(method: string, path: string, body?: unknown, fetchImpl: typeof fetch = fetch): Promise<EditResult> {
	const res = await fetchImpl(`/api${path}`, {
		method,
		headers: body === undefined ? { accept: 'application/json' } : { accept: 'application/json', 'content-type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	if (res.ok) return { plan: (await res.json()) as PlanDetail, superseded: false };
	if (res.status === 409) return { plan: (await res.json()) as PlanDetail, superseded: true };
	throw await apiErrorFrom(res);
}

const day = (planID: string, d: number) => `/training/plans/${planID}/days/${d}`;
const exercise = (planID: string, d: number, i: number) => `${day(planID, d)}/exercises/${i}`;

export const edits = {
	setStartTime: (planID: string, d: number, startTime: string) =>
		send('PUT', `${day(planID, d)}/start-time`, { startTime }),
	/** fetchImpl lets a form action (event.fetch) reuse this through the same proxy. */
	add: (planID: string, d: number, catalogSlug: string, fetchImpl?: typeof fetch) =>
		send('POST', `${day(planID, d)}/exercises`, { catalogSlug }, fetchImpl),
	swap: (planID: string, d: number, i: number, catalogSlug: string) =>
		send('PUT', exercise(planID, d, i), { catalogSlug }),
	remove: (planID: string, d: number, i: number) => send('DELETE', exercise(planID, d, i)),
	move: (planID: string, d: number, i: number, direction: 'up' | 'down') =>
		send('POST', `${exercise(planID, d, i)}/move`, { direction }),
	setPrescription: (planID: string, d: number, i: number, sets: number, reps: string, restSeconds: number) =>
		send('PUT', `${exercise(planID, d, i)}/prescription`, { sets, reps, restSeconds })
};

/**
 * The picker's options: ranked suggestions for an empty query, catalog
 * matches for a typed one (Go: fillPicker). index is the exercise being
 * swapped, or null when adding to the end of the day.
 */
export async function pickerOptions(
	planID: string,
	d: number,
	index: number | null,
	query: string,
	signal?: AbortSignal
): Promise<CatalogExercise[]> {
	const path = index === null ? `${day(planID, d)}/suggestions` : `${exercise(planID, d, index)}/replacements`;
	const q = query.trim();
	const res = await fetch(`/api${path}${q ? `?q=${encodeURIComponent(q)}` : ''}`, {
		headers: { accept: 'application/json' },
		signal
	});
	if (!res.ok) throw await apiErrorFrom(res);
	const body = (await res.json()) as { exercises: CatalogExercise[] };
	return body.exercises;
}
