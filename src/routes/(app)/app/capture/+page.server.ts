import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import {
	embedReturnTo,
	isCaptureFormError,
	itemsFromForm,
	sharedText,
	tryAgain,
	type CaptureState
} from '#lib/features/capture/capture.js';
import type { Actions, PageServerLoad } from './$types';

// Go: GET /app/capture (internal/capture/handler.go show) — the empty box, or
// one prefilled from the PWA share target. GET /app/capture/panel is the same
// box as a fragment; here it is CapturePanel, embedded by the pages that want
// it, posting to the actions below.
export const load: PageServerLoad = ({ url }) => ({ text: sharedText(url.searchParams) });

/** A failure the person can act on keeps its words; anything else is "try again". */
function message(err: unknown): string {
	if (isApiError(err) && err.status < 500) return err.message;
	return tryAgain;
}

export const actions: Actions = {
	// Go: POST /app/capture/parse (metered by the API's quick-capture quota).
	parse: async (event) => {
		const form = await event.request.formData();
		const text = String(form.get('text') ?? '').trim();
		const returnTo = embedReturnTo(String(form.get('return_to') ?? ''));
		try {
			const { data } = await serverApi(event).POST('/capture/parse', { body: { text } });
			const draft = { items: data?.items ?? [], unparsed: data?.unparsed ?? [] };
			if (draft.items.length === 0 && draft.unparsed.length === 0) {
				return { capture: { text, returnTo, error: 'I could not find anything to log in that.' } satisfies CaptureState };
			}
			return { capture: { text, returnTo, draft } satisfies CaptureState };
		} catch (err) {
			// The sentence is kept: a failed parse must never cost somebody their words.
			const status = isApiError(err) && err.status < 500 ? 422 : 200;
			const capture: CaptureState = { text, returnTo, error: message(err) };
			return status === 422 ? fail(422, { capture }) : { capture };
		}
	},

	// Go: POST /app/capture/commit
	commit: async (event) => {
		const form = await event.request.formData();
		const text = String(form.get('text') ?? '').trim();
		const returnTo = embedReturnTo(String(form.get('return_to') ?? ''));
		let receipt;
		try {
			const items = itemsFromForm(form);
			const { data } = await serverApi(event).POST('/capture/commit', { body: { items } });
			receipt = { written: data?.written ?? 0, failed: data?.failed ?? 0, outcomes: data?.outcomes ?? [] };
		} catch (err) {
			if (isCaptureFormError(err)) return fail(422, { capture: { text, returnTo, error: err.message } satisfies CaptureState });
			if (isApiError(err) && err.status < 500) return fail(422, { capture: { text, returnTo, error: message(err) } satisfies CaptureState });
			return { capture: { text, returnTo, error: tryAgain } satisfies CaptureState };
		}
		// Embedded, a clean save goes back to the page it was made on, which
		// shows the new entries. A receipt with a failure stays on screen.
		if (returnTo && receipt.failed === 0) redirect(303, returnTo);
		return { capture: { text: '', returnTo, receipt } satisfies CaptureState };
	}
};
