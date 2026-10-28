// The names self-refreshing check-in displays agree on (north-client
// web/shared/live). In Go a save announced CHECKIN_SAVED through HX-Trigger on
// body and every display listened with "checkin-saved from:body, every 20s".
// Here a save dispatches the event on document and a display subscribes with
// onCheckInSaved(), which also polls for saves made elsewhere.

/** The event a check-in save, edit or delete announces. */
export const CHECKIN_SAVED = 'checkin-saved';

/** How often a live display polls for saves made in another tab or app. */
export const CHECKIN_POLL_MS = 20_000;

/** Announces a check-in save to every live display on the page. */
export function announceCheckInSaved(): void {
	document.dispatchEvent(new CustomEvent(CHECKIN_SAVED));
}

/**
 * Calls refresh at once after a save in this tab and every 20 seconds.
 * Returns the unsubscribe function, so it fits an $effect directly.
 */
export function onCheckInSaved(refresh: () => void, pollMs: number = CHECKIN_POLL_MS): () => void {
	const handler = () => refresh();
	document.addEventListener(CHECKIN_SAVED, handler);
	const timer = setInterval(handler, pollMs);
	return () => {
		document.removeEventListener(CHECKIN_SAVED, handler);
		clearInterval(timer);
	};
}
