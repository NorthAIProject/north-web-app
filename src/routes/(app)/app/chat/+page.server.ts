import { redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { clipDraft } from '#lib/features/coach/copy.js';
import type { Actions, PageServerLoad } from './$types';

// GET /app/chat (Go coach.Handler.index): open the most recent conversation,
// or show the empty coach page when there is none.
export const load: PageServerLoad = async (event) => {
	const api = serverApi(event);
	const { data } = await api.GET('/conversations');
	const list = data?.conversations ?? [];
	if (list.length > 0) redirect(303, `/app/chat/${list[0].id}`);
	const { data: stats } = await api.GET('/conversations/stats');
	// Wide, like a conversation, so moving between the two keeps one shell.
	return { wide: true as const, list, stats: stats ?? { threadCount: 0, messagesThisWeek: 0 } };
};

// POST /app/chat (Go startConversation): every "New conversation", "New chat",
// "Start a reflection" and starter chip form posts here, from any chat page.
export const actions: Actions = {
	start: async (event) => {
		const form = await event.request.formData();
		const kind = String(form.get('kind') ?? '').trim() === 'reflection' ? 'reflection' : 'chat';
		const { data } = await serverApi(event).POST('/conversations', { body: { kind } });
		const draft = clipDraft(String(form.get('draft') ?? ''));
		redirect(303, `/app/chat/${data!.id}${draft ? `?draft=${encodeURIComponent(draft)}` : ''}`);
	}
};
