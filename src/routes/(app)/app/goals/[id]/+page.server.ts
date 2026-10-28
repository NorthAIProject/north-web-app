import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import {
	goalErrors,
	goalFormFrom,
	goalRequest,
	milestoneFrom,
	milestoneRequest
} from '#lib/features/goals/goals.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/goals/handler.go — GET /app/goals/{id} and every form on it
// (edit, status, progress note, milestones add/edit/status/delete, delete).
// Go posted each to its own URL; here they are named actions on the page.
export const load: PageServerLoad = async (event) => {
	event.depends('north:goal');
	try {
		const { data } = await serverApi(event).GET('/goals/{goalID}', {
			params: { path: { goalID: event.params.id } }
		});
		return { goal: data!, done: event.url.searchParams.get('done') };
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	}
};

const page = (event: RequestEvent, query = '') => `/app/goals/${event.params.id}${query}`;
const goalPath = (event: RequestEvent) => ({ params: { path: { goalID: event.params.id! } } });
const milestonePath = (event: RequestEvent, milestoneID: string) => ({
	params: { path: { goalID: event.params.id!, milestoneID } }
});

/** A 404 from the API is the Go handler's "Not found." page. */
function notFound(err: unknown): never {
	if (isApiError(err) && err.status === 404) error(404, 'Not found.');
	throw err;
}

export const actions: Actions = {
	update: async (event) => {
		const form = goalFormFrom(await event.request.formData());
		try {
			await serverApi(event).PUT('/goals/{goalID}', { ...goalPath(event), body: goalRequest(form) });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { kind: 'goal' as const, errors: goalErrors(err.fields), values: form });
			}
			notFound(err);
		}
		redirect(303, page(event));
	},

	status: async (event) => {
		const status = String((await event.request.formData()).get('status') ?? '');
		try {
			await serverApi(event).PUT('/goals/{goalID}/status', { ...goalPath(event), body: { status } });
		} catch (err) {
			notFound(err);
		}
		redirect(303, page(event, status === 'achieved' ? '?done=goal' : ''));
	},

	note: async (event) => {
		const data = await event.request.formData();
		const note = String(data.get('note') ?? '');
		const raw = String(data.get('progress') ?? '').trim();
		const progress = /^[+-]?\d+$/.test(raw) ? Number(raw) : undefined;
		try {
			await serverApi(event).POST('/goals/{goalID}/updates', { ...goalPath(event), body: { note, progress } });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				// Go shows only the note's message, under the note.
				return fail(422, { kind: 'note' as const, error: err.fields.note ?? err.fields.progress ?? err.message });
			}
			notFound(err);
		}
		redirect(303, page(event));
	},

	addMilestone: async (event) => {
		const m = milestoneFrom(await event.request.formData());
		try {
			await serverApi(event).POST('/goals/{goalID}/milestones', { ...goalPath(event), body: milestoneRequest(m) });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { kind: 'milestone' as const, editing: '', errors: err.fields, values: m });
			}
			notFound(err);
		}
		redirect(303, page(event));
	},

	editMilestone: async (event) => {
		const data = await event.request.formData();
		const mid = String(data.get('milestone_id') ?? '');
		const m = milestoneFrom(data);
		try {
			await serverApi(event).PUT('/goals/{goalID}/milestones/{milestoneID}', {
				...milestonePath(event, mid),
				body: milestoneRequest(m)
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { kind: 'milestone' as const, editing: mid, errors: err.fields, values: m });
			}
			notFound(err);
		}
		redirect(303, page(event));
	},

	milestoneStatus: async (event) => {
		const data = await event.request.formData();
		const mid = String(data.get('milestone_id') ?? '');
		const status = String(data.get('status') ?? '');
		try {
			await serverApi(event).PUT('/goals/{goalID}/milestones/{milestoneID}/status', {
				...milestonePath(event, mid),
				body: { status }
			});
		} catch (err) {
			notFound(err);
		}
		redirect(303, page(event, status === 'completed' ? `?done=milestone:${mid}` : ''));
	},

	deleteMilestone: async (event) => {
		const mid = String((await event.request.formData()).get('milestone_id') ?? '');
		try {
			await serverApi(event).DELETE('/goals/{goalID}/milestones/{milestoneID}', milestonePath(event, mid));
		} catch (err) {
			notFound(err);
		}
		redirect(303, page(event));
	},

	delete: async (event) => {
		try {
			await serverApi(event).DELETE('/goals/{goalID}', goalPath(event));
		} catch (err) {
			notFound(err);
		}
		redirect(303, '/app/goals');
	}
};
