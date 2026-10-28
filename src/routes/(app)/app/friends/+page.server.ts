import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { shareLinks } from '#lib/features/social/share.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/social/handler.go (GET /app/friends and every POST under it)
// and handler_finding.go (phone, Facebook). Each Go POST route is a named
// action here; see docs/migration/social.md for the map.
export const load: PageServerLoad = async (event) => {
	event.depends('north:social');
	const api = serverApi(event);
	const [overview, feed, sharing, x, fb, phone, countries, facebook] = await Promise.all([
		api.GET('/social'),
		api.GET('/feed'),
		api.GET('/social/sharing'),
		api.GET('/invites', { params: { query: { channel: 'x' } } }),
		api.GET('/invites', { params: { query: { channel: 'facebook' } } }),
		api.GET('/social/phone'),
		api.GET('/social/phone/countries'),
		api.GET('/social/facebook')
	]);
	return {
		overview: overview.data!,
		feed: feed.data!.items,
		sharing: sharing.data!,
		share: shareLinks(x.data!.url, fb.data!.url),
		phone: phone.data!,
		countries: countries.data!,
		facebook: facebook.data!,
		facebookResult: event.url.searchParams.get('facebook') ?? '',
		// The feed's "5m ago" is measured from this, so server and browser agree.
		now: Date.now()
	};
};

/** The {userID} a person action is about (Go: chi.URLParam "userID"). */
async function personID(event: RequestEvent): Promise<string> {
	const id = String((await event.request.formData()).get('id') ?? '');
	if (!/^[0-9a-f-]{36}$/i.test(id)) error(404, 'Not found.');
	return id;
}

/** Go's fail: a 404 is "Not found."; anything else bubbles to the error page. */
function notFound(err: unknown): never {
	if (isApiError(err) && err.status === 404) error(404, 'Not found.');
	throw err;
}

/** A refused form re-renders the page with the fields' messages (Go: formError). */
function refused(
	err: unknown,
	values: Record<string, string>,
	rename: Record<string, string> = {}
) {
	if (isApiError(err) && err.status === 422 && Object.keys(err.fields).length > 0) {
		const errors: Record<string, string> = {};
		for (const [k, v] of Object.entries(err.fields)) errors[rename[k] ?? k] = v;
		return fail(422, { ...values, errors });
	}
	return notFound(err);
}

/** Go: phoneFieldError — a rate limit shows next to the field that hit it. */
const rateLimited = 'Too many codes for now. Try again in an hour.';

export const actions: Actions = {
	// POST /app/friends/handle
	handle: async (event) => {
		const handle = String((await event.request.formData()).get('handle') ?? '');
		try {
			await serverApi(event).PUT('/social/handle', { body: { handle } });
		} catch (err) {
			return refused(err, { handle });
		}
		redirect(303, '/app/friends');
	},

	// POST /app/friends/follow
	follow: async (event) => {
		const follow = String((await event.request.formData()).get('follow') ?? '');
		try {
			await serverApi(event).POST('/follows', { body: { handle: follow } });
		} catch (err) {
			if (isApiError(err) && err.status === 404) {
				return fail(422, { follow, errors: { follow: 'Nobody has that handle.' } });
			}
			return refused(err, { follow }, { handle: 'follow' });
		}
		redirect(303, '/app/friends');
	},

	// POST /app/friends/{userID}/accept
	accept: async (event) => {
		const userID = await personID(event);
		await serverApi(event)
			.POST('/followers/{userID}/accept', { params: { path: { userID } } })
			.catch(notFound);
		redirect(303, '/app/friends');
	},

	// POST /app/friends/{userID}/remove
	remove: async (event) => {
		const userID = await personID(event);
		await serverApi(event)
			.DELETE('/followers/{userID}', { params: { path: { userID } } })
			.catch(notFound);
		redirect(303, '/app/friends');
	},

	// POST /app/friends/{userID}/unfollow
	unfollow: async (event) => {
		const userID = await personID(event);
		await serverApi(event)
			.DELETE('/follows/{userID}', { params: { path: { userID } } })
			.catch(notFound);
		redirect(303, '/app/friends');
	},

	// POST /app/friends/{userID}/block
	block: async (event) => {
		const userID = await personID(event);
		await serverApi(event)
			.POST('/blocks/{userID}', { params: { path: { userID } } })
			.catch(notFound);
		redirect(303, '/app/friends');
	},

	// POST /app/friends/{userID}/unblock
	unblock: async (event) => {
		const userID = await personID(event);
		await serverApi(event)
			.DELETE('/blocks/{userID}', { params: { path: { userID } } })
			.catch(notFound);
		redirect(303, '/app/friends');
	},

	// POST /app/friends/sharing — an unchecked switch posts nothing, so absent is off.
	sharing: async (event) => {
		const f = await event.request.formData();
		const on = (name: string) => f.get(name) !== null && f.get(name) !== '';
		await serverApi(event)
			.PUT('/social/sharing', {
				body: {
					training: on('share_training'),
					streaks: on('share_streaks'),
					goals: on('share_goals'),
					xp: on('share_xp'),
					awards: on('share_awards')
				}
			})
			.catch(notFound);
		redirect(303, '/app/friends');
	},

	// POST /app/friends/kudos/{achievementID}
	kudos: async (event) => {
		const achievementID = await personID(event);
		await serverApi(event)
			.POST('/achievements/{achievementID}/kudos', { params: { path: { achievementID } } })
			.catch(notFound);
		redirect(303, '/app/friends#feed');
	},

	// POST /app/friends/kudos/{achievementID}/undo
	unkudos: async (event) => {
		const achievementID = await personID(event);
		await serverApi(event)
			.DELETE('/achievements/{achievementID}/kudos', { params: { path: { achievementID } } })
			.catch(notFound);
		redirect(303, '/app/friends#feed');
	},

	// POST /app/friends/phone
	phone: async (event) => {
		const f = await event.request.formData();
		const phone = String(f.get('phone') ?? '');
		const country = String(f.get('countryCode') ?? '');
		try {
			await serverApi(event).POST('/social/phone/verification', {
				body: { phone, countryCode: country }
			});
		} catch (err) {
			if (isApiError(err) && err.status === 429)
				return fail(422, { phone, country, errors: { phone: rateLimited } });
			return refused(err, { phone, country });
		}
		redirect(303, '/app/friends#phone-card');
	},

	// POST /app/friends/phone/check
	phoneCheck: async (event) => {
		const code = String((await event.request.formData()).get('code') ?? '');
		try {
			await serverApi(event).POST('/social/phone/verification/check', { body: { code } });
		} catch (err) {
			if (isApiError(err) && err.status === 429)
				return fail(422, { errors: { code: rateLimited } });
			return refused(err, {});
		}
		redirect(303, '/app/friends#phone-card');
	},

	// POST /app/friends/phone/cancel
	phoneCancel: async (event) => {
		await serverApi(event).DELETE('/social/phone/verification').catch(notFound);
		redirect(303, '/app/friends#phone-card');
	},

	// POST /app/friends/phone/remove
	phoneRemove: async (event) => {
		await serverApi(event).DELETE('/social/phone').catch(notFound);
		redirect(303, '/app/friends#phone-card');
	},

	// POST /app/friends/facebook/disconnect
	facebookDisconnect: async (event) => {
		await serverApi(event).DELETE('/social/facebook').catch(notFound);
		redirect(303, '/app/friends#facebook');
	}
};
