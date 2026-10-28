import { error, fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { clipDraft } from '#lib/features/coach/copy.js';
import type { Actions, PageServerLoad } from './$types';

// GET /app/chat/{id} (Go coach.Handler.show): the conversation, the thread
// list beside it, the coach strip, and any approval or owed resume.
export const load: PageServerLoad = async (event) => {
	event.depends('north:chat');
	const api = serverApi(event);
	const id = event.params.id;
	try {
		const [detail, list, stats] = await Promise.all([
			api.GET('/conversations/{id}', { params: { path: { id } } }),
			api.GET('/conversations'),
			api.GET('/conversations/stats')
		]);
		return {
			detail: detail.data!,
			list: list.data?.conversations ?? [],
			stats: stats.data ?? { threadCount: 0, messagesThisWeek: 0 },
			draft: clipDraft(event.url.searchParams.get('draft'))
		};
	} catch (err) {
		// A malformed id is a 404 too (Go: uuid.Parse → ErrNotFound).
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		throw err;
	}
};

export const actions: Actions = {
	// POST /app/chat/{id}/delete
	delete: async (event) => {
		await serverApi(event).DELETE('/conversations/{id}', { params: { path: { id: event.params.id } } });
		redirect(303, '/app/chat');
	},

	// POST /app/chat/{id}/messages/{messageID}/helpful — the no-JS path; the
	// page swaps the control in place with JavaScript (Go: hx-post).
	helpful: async (event) => {
		const form = await event.request.formData();
		const messageID = String(form.get('messageId') ?? '');
		const helpful = parseHelpful(String(form.get('answer') ?? ''));
		if (helpful === undefined) error(404, 'Not found.');
		const { data } = await serverApi(event).PUT('/conversations/{id}/messages/{messageID}/helpful', {
			params: { path: { id: event.params.id, messageID } },
			body: { helpful }
		});
		return { rated: data! };
	},

	// POST /app/chat/{id}/tools/{messageID}/{decision}. The tools run inside
	// this request (minutes for a new plan) and finish even if it is dropped.
	decide: async (event) => {
		const form = await event.request.formData();
		const messageID = String(form.get('messageId') ?? '');
		const decision = String(form.get('decision') ?? '');
		if (decision !== 'approve' && decision !== 'decline') error(404, 'Not found.');
		try {
			await serverApi(event).POST('/conversations/{id}/tools/{messageID}', {
				params: { path: { id: event.params.id, messageID } },
				body: { approve: decision === 'approve' }
			});
		} catch (err) {
			// Already being resolved, or the turn moved on: the page re-reads
			// the conversation and shows whatever is true now.
			if (isApiError(err) && (err.status === 409 || err.status === 404)) {
				return fail(err.status, { decideError: err.message });
			}
			throw err;
		}
		redirect(303, `/app/chat/${event.params.id}`);
	}
};

// types.ParseHelpful: "helpful", "unhelpful", or "clear" to take it back.
function parseHelpful(answer: string): boolean | null | undefined {
	switch (answer) {
		case 'helpful':
			return true;
		case 'unhelpful':
			return false;
		case 'clear':
			return null;
		default:
			return undefined;
	}
}
