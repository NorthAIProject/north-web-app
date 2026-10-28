// "A write just succeeded": the app-wide signal the awards host listens to.
//
// Go's shell fired awards-check after every successful non-GET htmx request
// (htmx:after:request), so a badge earned by any save opened its celebration
// on the spot. Detection here is just as global, and pages need nothing:
//
// - every browserApi() call that is not GET/HEAD and succeeds announces itself
//   (a middleware in #lib/api/client.ts calls announceWrite());
// - every enhanced form action result updates page.form, which AwardsHost
//   watches (a status below 400 counts as a write);
// - plain form posts and redirects navigate, and the host checks after every
//   navigation, as Go's host did on load.
//
// notifyWrite, withWriteNotify and writing are kept as no-ops for the pages
// that still call them; new code should not.

import type { SubmitFunction } from '$app/forms';

/** The DOM event a successful write dispatches on document. */
export const WRITE_EVENT = 'north:write';

/** Announces a successful write. Called by the browserApi middleware; browser-only. */
export function announceWrite(): void {
	if (typeof document === 'undefined') return;
	document.dispatchEvent(new CustomEvent(WRITE_EVENT));
}

/** Calls fn after every announced write. Returns the unsubscribe, so it fits an $effect. */
export function onWrite(fn: () => void): () => void {
	const handler = () => fn();
	document.addEventListener(WRITE_EVENT, handler);
	return () => document.removeEventListener(WRITE_EVENT, handler);
}

/** @deprecated Writes are detected automatically; this does nothing. */
export function notifyWrite(): void {}

/** @deprecated Form results are detected through page.form; returns `submit` unchanged. */
export function withWriteNotify(submit?: SubmitFunction): SubmitFunction {
	return submit ?? (() => {});
}

/** @deprecated Writes are detected automatically; returns the call unchanged. */
export function writing<T>(call: Promise<T>): Promise<T> {
	return call;
}
