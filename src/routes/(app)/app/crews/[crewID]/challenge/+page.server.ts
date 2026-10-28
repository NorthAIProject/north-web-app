import { redirect, type RequestEvent } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { challengeURL } from '#lib/features/crews/crew.js';
import { loadSpace, spaceActions } from '#lib/features/crews/space.server.js';
import type { Actions, PageServerLoad } from './$types';

// Go: crews.Handler.challengePage (GET /app/crews/{id}/challenge) and the
// owner's and admins' forms on it: role, remove, challenge.
export const load: PageServerLoad = (event) => loadSpace(event, event.params.crewID, '', 'challenge');

const crewIDOf = (event: RequestEvent) => event.params.crewID!;

export const actions: Actions = {
	...spaceActions(crewIDOf),
	/** Go: POST /crews/{id}/members/{userID}/role — admin, or member again. */
	role: async (event) => {
		const crewID = crewIDOf(event);
		const form = await event.request.formData();
		await serverApi(event).PUT('/crews/{crewID}/members/{userID}/role', {
			params: { path: { crewID, userID: String(form.get('member') ?? '') } },
			body: { role: String(form.get('role') ?? '') }
		});
		redirect(303, challengeURL(crewID));
	},
	/** Go: POST /crews/{id}/members/{userID}/remove. */
	remove: async (event) => {
		const crewID = crewIDOf(event);
		const form = await event.request.formData();
		await serverApi(event).DELETE('/crews/{crewID}/members/{userID}', {
			params: { path: { crewID, userID: String(form.get('member') ?? '') } }
		});
		redirect(303, challengeURL(crewID));
	},
	/** Go: POST /crews/{id}/challenge — set it, or clear it when kind is "none". */
	challenge: async (event) => {
		const crewID = crewIDOf(event);
		const form = await event.request.formData();
		const kind = String(form.get('kind') ?? '');
		const api = serverApi(event);
		if (kind === 'none') {
			await api.DELETE('/crews/{crewID}/challenge', { params: { path: { crewID } } });
		} else {
			await api.PUT('/crews/{crewID}/challenge', {
				params: { path: { crewID } },
				body: { kind: kind as 'checkins' | 'workouts', target: Number.parseInt(String(form.get('target') ?? ''), 10) || 0 }
			});
		}
		redirect(303, challengeURL(crewID));
	}
};
