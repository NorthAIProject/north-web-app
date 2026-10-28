// The report generation actions both report pages share (Go handler.generate
// and handler.regenerate): queue the work, then go to the report, or come
// back with the notice Go redirected with.

import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';

/** A quota refusal (429) is shown on the page with the API's sentence. */
function quota(err: unknown) {
	if (isApiError(err) && err.status === 429) return fail(429, { quota: err.message });
	return null;
}

export async function generate(event: RequestEvent) {
	let id: string;
	try {
		const { data } = await serverApi(event).POST('/reports/generate');
		id = data!.id;
	} catch (err) {
		if (isApiError(err) && err.status === 409) redirect(303, '/app/reports?notice=cooldown');
		const refused = quota(err);
		if (refused) return refused;
		throw err;
	}
	redirect(303, `/app/reports/${id}`);
}

export async function regenerate(event: RequestEvent, reportID: string) {
	let id: string;
	try {
		const { data } = await serverApi(event).POST('/reports/{reportID}/regenerate', {
			params: { path: { reportID } }
		});
		id = data!.id;
	} catch (err) {
		if (isApiError(err) && err.status === 409) {
			const notice = err.code === 'archived' ? 'archived' : 'cooldown';
			redirect(303, `/app/reports/${reportID}?notice=${notice}`);
		}
		const refused = quota(err);
		if (refused) return refused;
		throw err;
	}
	redirect(303, `/app/reports/${id}`);
}
