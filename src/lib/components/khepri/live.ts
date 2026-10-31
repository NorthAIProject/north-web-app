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
 * Calls refresh at once after a save in this tab and every 20 seconds while
 * the page is visible. A background tab does not poll; when it comes back
 * after missing a beat it refreshes once, straight away. Returns the
 * unsubscribe function, so it fits an $effect directly.
 */
export function onCheckInSaved(refresh: () => void, pollMs: number = CHECKIN_POLL_MS): () => void {
	let last = Date.now();
	const run = () => {
		last = Date.now();
		refresh();
	};
	const tick = () => {
		if (!document.hidden) run();
	};
	const onVisibility = () => {
		if (!document.hidden && Date.now() - last >= pollMs) run();
	};
	document.addEventListener(CHECKIN_SAVED, run);
	document.addEventListener('visibilitychange', onVisibility);
	const timer = setInterval(tick, pollMs);
	return () => {
		document.removeEventListener(CHECKIN_SAVED, run);
		document.removeEventListener('visibilitychange', onVisibility);
		clearInterval(timer);
	};
}
