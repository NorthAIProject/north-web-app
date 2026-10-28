import { error, json } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { formErrors, formFromData, requestFrom } from '#lib/features/checkins/checkins.js';
import { serverApi } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

// Go: checkins.Handler.update and .delete (PATCH and DELETE /app/check-ins/{id}).
// No Go template called either route; they are kept so editing a past check-in
// stays one front-end change away. Each takes what Go took: PATCH the wizard's
// form fields, DELETE nothing. Go answered htmx with HTML fragments; these
// answer fetch with JSON, the edit refused field by field as the page's save
// action refuses (422 with errors keyed by form field).

function apiFailure(err: unknown): never {
	if (isApiError(err)) error(err.status, err.message);
	throw err;
}

export const PATCH: RequestHandler = async (event) => {
	const form = formFromData(await event.request.formData());
	try {
		const { data } = await serverApi(event).PUT('/check-ins/{checkInID}', {
			params: { path: { checkInID: event.params.id } },
			body: requestFrom(form)
		});
		return json({ saved: data });
	} catch (err) {
		if (isApiError(err) && err.status === 422) {
			return json({ errors: formErrors(err.fields), values: form }, { status: 422 });
		}
		apiFailure(err);
	}
};

// Go answered htmx with 204 and a redirect to the list otherwise; fetch gets the 204.
export const DELETE: RequestHandler = async (event) => {
	try {
		await serverApi(event).DELETE('/check-ins/{checkInID}', {
			params: { path: { checkInID: event.params.id } }
		});
	} catch (err) {
		apiFailure(err);
	}
	return new Response(null, { status: 204 });
};
