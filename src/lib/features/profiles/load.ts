// Shared load pieces for the profile pages (north-client internal/profiles/handler.go).

import { error } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';

/** Turns the API's 404 (unknown handle, a block either way) into the page's 404; anything else bubbles. */
export async function orNotFound<T>(p: Promise<T>): Promise<T> {
	try {
		return await p;
	} catch (err) {
		if (isApiError(err) && (err.status === 404 || err.status === 422)) error(404, 'Not found.');
		throw err;
	}
}
