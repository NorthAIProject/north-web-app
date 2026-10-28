// What every page of a crew's space loads (Go: crews.Handler.renderSpace),
// and the forms they all carry: leave, notifications, the crew rules.
import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { crewURL, mutedUntil, type Tab } from './crew.js';

type Event = Pick<RequestEvent, 'fetch' | 'locals'> & { depends: (...deps: `${string}:${string}`[]) => void };

/** A crew that is not there, or one the viewer is not in, is a 404 (Go: h.fail → ErrNotFound). */
function notFound(err: unknown): never {
	if (isApiError(err) && (err.status === 404 || err.status === 403)) error(404, 'Not found.');
	throw err;
}

/**
 * The space with channelID open (the default channel when it is empty), the
 * viewer's crews for the rail, and the open tab's content: the channel's
 * latest page, or the challenge board.
 */
export async function loadSpace(event: Event, crewID: string, channelID: string, tab: Tab) {
	event.depends('north:crew');
	const api = serverApi(event);
	const [space, mine] = await Promise.all([
		api.GET('/crews/{crewID}/space', { params: { path: { crewID } } }).then((r) => r.data!, notFound),
		api.GET('/crews').then((r) => r.data!.crews)
	]);
	const channels = space.channels ?? [];
	const open = channels.find((ch) => (channelID ? ch.id === channelID : ch.default));
	if (!open) error(404, 'Not found.');

	if (tab === 'challenge') {
		const { data: board } = await api.GET('/crews/{crewID}', { params: { path: { crewID } } }).catch(notFound);
		return { wide: true as const, tab, space, mine, channel: open, board: board!, page: null };
	}
	const { data: page } = await api
		.GET('/crews/{crewID}/channels/{channelID}/messages', { params: { path: { crewID, channelID: open.id } } })
		.catch(notFound);
	return { wide: true as const, tab, space, mine, channel: open, board: null, page: page! };
}

/** Where a form on the page goes back to: the page it was posted from. */
function back(event: RequestEvent, crewID: string): string {
	const path = event.url.pathname;
	return path.startsWith(crewURL(crewID)) ? path : crewURL(crewID);
}

/** The forms every page of the space posts (Go: /leave, /notifications, /app/moderation/terms). */
export function spaceActions(crewIDOf: (event: RequestEvent) => string) {
	return {
		/** Leaving is taking yourself out (API: DELETE /crews/{id}/members/{me}). */
		leave: async (event: RequestEvent) => {
			const crewID = crewIDOf(event);
			const me = event.locals.session?.user?.id;
			if (!me) redirect(303, '/login');
			await serverApi(event).DELETE('/crews/{crewID}/members/{userID}', {
				params: { path: { crewID, userID: me } }
			});
			redirect(303, '/app/crews');
		},
		/** Which messages push the member, and a mute for a while (Go: setNotify). */
		notify: async (event: RequestEvent) => {
			const crewID = crewIDOf(event);
			const form = await event.request.formData();
			const until = mutedUntil(String(form.get('mute') ?? ''));
			try {
				await serverApi(event).PUT('/crews/{crewID}/notifications', {
					params: { path: { crewID } },
					body: { notify: String(form.get('notify') ?? ''), ...(until ? { mutedUntil: until } : {}) }
				});
			} catch (err) {
				if (isApiError(err) && err.status === 422) return fail(422, { notifyError: err.message });
				throw err;
			}
			redirect(303, back(event, crewID));
		},
		/** Accepting the crew rules returns to the page (Go: moderation.Handler.acceptTerms). */
		terms: async (event: RequestEvent) => {
			const crewID = crewIDOf(event);
			await serverApi(event).POST('/moderation/terms');
			redirect(303, back(event, crewID));
		}
	};
}
