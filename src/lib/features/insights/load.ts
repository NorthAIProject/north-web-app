// Shared bits of the insights pages' loads (server-side).

import { error } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';

/**
 * The ?range= query every insights read takes. An absent or hand-typed value
 * is passed through: the API's timerange.Parse never fails, it falls back.
 */
export function rangeQuery(url: URL): { range?: string } {
	const range = url.searchParams.get('range');
	return range ? { range } : {};
}

/**
 * Runs an API read and turns its 404 into the page's 404 and a 422 into the
 * Go handler's "That request could not be read." Anything else bubbles.
 */
export async function readOr404<T>(read: () => Promise<T>): Promise<T> {
	try {
		return await read();
	} catch (err) {
		if (isApiError(err) && err.status === 404) error(404, 'Not found.');
		if (isApiError(err) && err.status === 422) error(422, 'That request could not be read.');
		throw err;
	}
}
