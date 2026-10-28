import { error, fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { text } from '#lib/features/settings/form.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/settings/handler.go renderConnections and the posts under
// /app/settings/connections, /settings/messaging/telegram,
// /settings/integrations/calendar and /settings/ai.
export const load: PageServerLoad = async (event) => {
	event.depends('north:settings');
	const api = serverApi(event);
	const [connections, ai, telegram, calendar] = await Promise.all([
		api.GET('/settings/connections'),
		api.GET('/settings/ai'),
		api.GET('/settings/telegram'),
		api.GET('/settings/calendar')
	]);
	return {
		connections: connections.data!,
		ai: ai.data!,
		telegram: telegram.data!,
		calendar: calendar.data!
	};
};

const back = '/app/settings/connections';

export const actions: Actions = {
	// Go: createConnection. The only write here that does not redirect: the
	// token exists in this response alone, so the page shows it from the
	// action's result and a reload will not show it again.
	create: async (event) => {
		const form = await event.request.formData();
		const values = { name: text(form, 'name'), kind: String(form.get('client_kind') ?? '') };
		try {
			const { data } = await serverApi(event).POST('/settings/connections', {
				body: { name: values.name, kind: values.kind as 'claude_code' }
			});
			return { form: 'create' as const, issued: data!, kind: values.kind };
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { form: 'create' as const, errors: err.fields, values });
			}
			throw err;
		}
	},

	// Go: revokeConnection.
	revoke: async (event) => {
		const form = await event.request.formData();
		const id = text(form, 'id');
		if (!id) error(404, { message: 'Not found.' });
		await serverApi(event).DELETE('/settings/connections/{connectionID}', {
			params: { path: { connectionID: id } }
		});
		redirect(303, back);
	},

	// Go: createTelegramCode. Like create, the code exists only in this response.
	telegramCode: async (event) => {
		const { data } = await serverApi(event).POST('/settings/telegram/code');
		return { form: 'telegram' as const, telegramCode: data!.code };
	},

	// Go: disconnectTelegram.
	telegramDisconnect: async (event) => {
		await serverApi(event).DELETE('/settings/telegram');
		redirect(303, back);
	},

	// Go: connectCalendar. A rejected endpoint is shown beside the fields.
	calendar: async (event) => {
		const form = await event.request.formData();
		try {
			await serverApi(event).PUT('/settings/calendar', {
				body: { endpoint: String(form.get('endpoint') ?? ''), token: String(form.get('token') ?? '') }
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { form: 'calendar' as const, message: err.fields.endpoint || err.message });
			}
			throw err;
		}
		redirect(303, back);
	},

	// Go: disconnectCalendar.
	calendarDisconnect: async (event) => {
		await serverApi(event).DELETE('/settings/calendar');
		redirect(303, back);
	},

	// Go: updateAICredential. The key is write-only: a rejected submission
	// comes back with everything but it.
	ai: async (event) => {
		const form = await event.request.formData();
		const values = {
			provider: String(form.get('provider') ?? ''),
			model: String(form.get('model') ?? ''),
			baseUrl: String(form.get('base_url') ?? '')
		};
		try {
			await serverApi(event).PUT('/settings/ai', {
				body: { ...values, apiKey: String(form.get('api_key') ?? '') }
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { form: 'ai' as const, errors: err.fields, values });
			}
			throw err;
		}
		redirect(303, back);
	},

	// Go: removeAICredential. Already gone is what was wanted.
	aiRemove: async (event) => {
		try {
			await serverApi(event).DELETE('/settings/ai');
		} catch (err) {
			if (!(isApiError(err) && err.status === 404)) throw err;
		}
		redirect(303, back);
	}
};
