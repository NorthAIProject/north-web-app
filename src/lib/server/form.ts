import { fail } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';

/**
 * Turns an API failure into what a form action hands back to its page: the
 * per-field messages for a 4xx (Go re-rendered the page with form.Errors),
 * the API's own localized message otherwise. Unknown errors are rethrown so
 * the error page shows them.
 */
export function formFailure<V extends Record<string, unknown>>(err: unknown, values: V) {
	if (!isApiError(err)) throw err;
	const errors = err.fields ?? {};
	const status = err.status === 0 ? 503 : err.status;
	return fail(status, { values, errors, error: Object.keys(errors).length ? '' : err.message });
}
