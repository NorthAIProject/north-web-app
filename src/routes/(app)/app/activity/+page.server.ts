import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { parseLogForm } from '#lib/features/activity/format.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/activity/handler.go (GET /app/activity and its six POSTs).
export const load: PageServerLoad = async (event) => {
	event.depends('north:activity');
	const { data } = await serverApi(event).GET('/activity');
	return { overview: data! };
};

/**
 * Runs one write and goes back to the page, or re-renders it with the reason
 * the API refused (Go: h.render(w, r, err.Error()) on validation, conflict and
 * not-found; anything else is a 500).
 */
async function attempt(run: () => Promise<unknown>) {
	try {
		await run();
	} catch (err) {
		if (isApiError(err) && [404, 409, 422].includes(err.status)) {
			return fail(err.status, { error: Object.values(err.fields)[0] ?? err.message });
		}
		throw err;
	}
	redirect(303, '/app/activity');
}

function sessionID(form: FormData): string {
	const id = String(form.get('id') ?? '');
	if (!/^[0-9a-f-]{36}$/i.test(id)) error(404, { message: 'Not found.' });
	return id;
}

function timeZoneOf(event: RequestEvent): string {
	return event.locals.session?.user?.timezone || 'UTC';
}

export const actions: Actions = {
	start: async (event) => {
		const form = await event.request.formData();
		const activityCode = String(form.get('activity_code') ?? '');
		return attempt(() => serverApi(event).POST('/activity/start', { body: { activityCode } }));
	},

	log: async (event) => {
		const form = await event.request.formData();
		const values = {
			activityCode: String(form.get('activity_code') ?? ''),
			minutes: String(form.get('minutes') ?? ''),
			distanceKm: String(form.get('distance_km') ?? ''),
			startedAt: String(form.get('started_at') ?? '')
		};
		let body;
		try {
			body = parseLogForm(values, timeZoneOf(event));
		} catch (err) {
			return fail(422, { error: (err as Error).message });
		}
		return attempt(() => serverApi(event).POST('/activity/log', { body }));
	},

	pause: async (event) => {
		const sessionID_ = sessionID(await event.request.formData());
		return attempt(() =>
			serverApi(event).POST('/activity/{sessionID}/pause', {
				params: { path: { sessionID: sessionID_ } }
			})
		);
	},

	resume: async (event) => {
		const sessionID_ = sessionID(await event.request.formData());
		return attempt(() =>
			serverApi(event).POST('/activity/{sessionID}/resume', {
				params: { path: { sessionID: sessionID_ } }
			})
		);
	},

	stop: async (event) => {
		const sessionID_ = sessionID(await event.request.formData());
		return attempt(() =>
			serverApi(event).POST('/activity/{sessionID}/stop', {
				params: { path: { sessionID: sessionID_ } }
			})
		);
	},

	cancel: async (event) => {
		const sessionID_ = sessionID(await event.request.formData());
		return attempt(() =>
			serverApi(event).DELETE('/activity/{sessionID}', {
				params: { path: { sessionID: sessionID_ } }
			})
		);
	}
};
