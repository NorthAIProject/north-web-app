import { error, redirect } from '@sveltejs/kit';
import { serverApi } from '#lib/server/api.js';
import { noticeOf, recapKey } from '#lib/features/recaps/view.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/recaps/handler.go — GET /app/recap (and /app/recap/panels,
// which the range links replace by re-running this load client-side).
export const load: PageServerLoad = async (event) => {
	event.depends('north:recap');
	const key = recapKey(event.url.searchParams.get('range'));
	try {
		const { data } = await serverApi(event).GET('/recap', { params: { query: { range: key } } });
		return {
			recap: data!,
			notice: noticeOf(event.url.searchParams.get('posted')),
			// Go passed cfg.BaseURL: the app's own address.
			siteUrl: event.url.origin
		};
	} catch {
		error(500, 'The recap could not be loaded.');
	}
};

export const actions: Actions = {
	// Go: POST /app/recap/share — post to the friends feed, then say whether
	// friends can see it.
	share: async (event) => {
		const form = await event.request.formData();
		const key = recapKey(String(form.get('range') ?? ''));
		const { data } = await serverApi(event).POST('/recap/share', {
			body: { range: key, shareTraining: form.get('share_training') === '1' }
		});
		redirect(303, `/app/recap?range=${key}&posted=${data?.trainingShared ? 'posted' : 'hidden'}`);
	}
};
