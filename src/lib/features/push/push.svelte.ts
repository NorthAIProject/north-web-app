// Web Push opt-in for nudges (port of north-client
// web/assets/js/shared/push.js). The state lives in the browser — the
// permission, the subscription, whether this is an installed PWA on iOS — so
// it is read asynchronously from navigator.serviceWorker and PushManager.
//
// The server half is /api/v1/push/{config,subscriptions} through the proxy:
// the VAPID key comes from GET /push/config instead of a data attribute, and
// no CSRF token is needed (the proxy adds the bearer).

import { browserApi } from '#lib/api/client.js';

export type PushState = 'checking' | 'unsupported' | 'install' | 'denied' | 'ready' | 'subscribed' | 'working' | 'failed';

/** Go push.js HINTS, keyed by state. English in Go too (the script carried no catalogue). */
export const PUSH_HINTS: Record<PushState, string> = {
	checking: '',
	unsupported: 'This browser cannot receive notifications.',
	install: 'Add Khepri to your Home Screen first — Safari only delivers notifications to installed apps.',
	denied: 'Notifications are blocked for this site. Allow them in your browser settings to turn this on.',
	ready: 'A short note when you have not checked in, a goal is due, or it is a training day.',
	subscribed: 'This device gets nudges. Quiet hours still apply.',
	working: 'One moment…',
	failed: 'That did not work. Try again in a moment.'
};

const DISMISSED_KEY = 'north.push.dismissed';

function supported(): boolean {
	return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// iOS ships Web Push only to PWAs on the Home Screen.
function needsInstall(): boolean {
	const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
	const standalone =
		(navigator as Navigator & { standalone?: boolean }).standalone === true ||
		window.matchMedia('(display-mode: standalone)').matches;
	return ios && !standalone;
}

/** "Not now" on the overview card, remembered in this browser only. */
export function pushDismissed(): boolean {
	try {
		return localStorage.getItem(DISMISSED_KEY) === '1';
	} catch {
		return false;
	}
}

export function rememberPushDismissed(): void {
	try {
		localStorage.setItem(DISMISSED_KEY, '1');
	} catch {
		// Private mode: the card comes back next visit, which is acceptable.
	}
}

// applicationServerKey wants raw bytes; the server hands over base64url.
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
	const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
	const raw = atob((base64url + padding).replace(/-/g, '+').replace(/_/g, '/'));
	const out = new Uint8Array(new ArrayBuffer(raw.length));
	for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
	return out;
}

/**
 * One browser's opt-in. Create it in a component and call refresh() from an
 * $effect (browser only); state is reactive.
 */
export class PushOptIn {
	state = $state<PushState>('checking');
	/** How many of the person's browsers listen (from /push/config). */
	devices = $state(0);
	/** Whether this deployment sends Web Push at all; null until /push/config answers. */
	available = $state<boolean | null>(null);
	private key = '';

	async refresh(): Promise<void> {
		try {
			const { data } = await browserApi().GET('/push/config');
			this.available = data?.enabled ?? false;
			this.key = data?.publicKey ?? '';
			this.devices = data?.devices ?? 0;
		} catch {
			this.available = false;
		}
		if (!this.available || !supported()) return this.show('unsupported');
		if (needsInstall()) return this.show('install');
		if (Notification.permission === 'denied') return this.show('denied');
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			this.show(sub ? 'subscribed' : 'ready');
		} catch {
			this.show('unsupported');
		}
	}

	async enable(): Promise<void> {
		this.show('working');
		try {
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') return this.show('denied');
			const reg = await navigator.serviceWorker.ready;
			const sub =
				(await reg.pushManager.getSubscription()) ??
				(await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(this.key) }));
			const json = sub.toJSON();
			try {
				await browserApi().POST('/push/subscriptions', {
					body: {
						endpoint: json.endpoint ?? sub.endpoint,
						keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
						userAgent: navigator.userAgent
					}
				});
			} catch (err) {
				// The server did not keep it, so the browser must not either, or
				// this device would look subscribed to a server that never sends.
				await sub.unsubscribe().catch(() => undefined);
				throw err;
			}
			this.devices += 1;
			this.show('subscribed');
		} catch {
			this.show('failed');
		}
	}

	async disable(): Promise<void> {
		this.show('working');
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			if (sub) {
				const endpoint = sub.endpoint;
				await sub.unsubscribe().catch(() => undefined);
				await browserApi().DELETE('/push/subscriptions', { body: { endpoint } });
				this.devices = Math.max(0, this.devices - 1);
			}
			this.show('ready');
		} catch {
			this.show('failed');
		}
	}

	private show(state: PushState): void {
		this.state = state;
	}
}
