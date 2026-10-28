/// <reference lib="webworker" />
// Khepri's service worker: an offline shell, and the ear for Web Push.
// A port of north-client web/pwa/sw.js; SvelteKit registers it for scope "/"
// (as /service-worker.js), which takes over any browser that still has the Go
// app's /sw.js registered for the same scope — and with it that
// registration's push subscription.
//
// The caching rule this file is built around has not changed. HTML, POSTs and
// SSE must never be served from a cache: a stale check-in form or a replayed
// coach stream is worse than a failed request. What is cached is only the
// static shell — fonts, icons, and the immutable app chunks — plus one offline
// page to show when a navigation cannot reach the server.
//
// The push handlers at the bottom are the other reason this file exists. A
// nudge the worker process decided on reaches the phone's lock screen through
// them, and a tap goes through /app/nudges/{id}/open so the server can record
// which channel brought the person back.
import { version } from '$app/env';

const sw = self as unknown as ServiceWorkerGlobalScope;

// The build version names the cache, so every deploy retires the previous one
// on activate — the job the Go worker did by hand-bumping "north-shell-vN".
const CACHE = `north-shell-${version}`;

const OFFLINE_URL = '/offline.html';

// offlineText is the one line served when even the offline page is missing
// from the cache, in the browser's language. Same picking as offline.html.
function offlineText(): string {
	const langs = sw.navigator.languages || [sw.navigator.language];
	for (const raw of langs) {
		const l = String(raw || '').toLowerCase();
		if (l === 'en' || l.startsWith('en-')) break;
		if (l === 'es' || l.startsWith('es-')) return 'Estás sin conexión.';
		if (l === 'pt' || l === 'pt-br') return 'Você está sem conexão.';
		if (l.startsWith('pt-')) return 'Estás sem ligação.';
	}
	return 'You are offline.';
}

// The shell, and only the shell. The app's JS and CSS are hashed chunks under
// /_app/immutable/ and are cached as they are fetched rather than precached:
// precaching every chunk would spend a first-run download on the three.js and
// ECharts bundles of pages nobody opens offline.
const SHELL = [
	OFFLINE_URL,
	'/assets/fonts/geist/geist-variable.woff2',
	'/assets/fonts/geist/geist-mono-variable.woff2',
	'/assets/brand/favicon.svg',
	'/assets/brand/pwa-192.png',
	'/assets/brand/pwa-512.png'
];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			// addAll fails the whole install if any single entry 404s, which would
			// leave the worker permanently uninstalled. Each is added on its own so
			// one renamed asset costs that asset rather than the offline page.
			await Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined)));
			await sw.skipWaiting();
		})()
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const names = await caches.keys();
			await Promise.all(names.map((name) => (name === CACHE ? undefined : caches.delete(name))));
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;

	// Anything that changes state goes to the network, always.
	if (request.method !== 'GET') return;

	// The coach's stream. Answering this from a cache would replay a reply that
	// was already delivered, which reads as the coach repeating itself.
	const accept = request.headers.get('accept') || '';
	if (accept.includes('text/event-stream')) return;

	// Cross-origin requests are somebody else's to cache.
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	// A page the person navigated to. Always from the network; the offline page
	// stands in only when the network is genuinely unreachable. Note this never
	// caches the real page — a signed-in dashboard in a shared cache is exactly
	// what this worker exists not to do.
	if (request.mode === 'navigate') {
		event.respondWith(
			(async () => {
				try {
					return await fetch(request);
				} catch {
					const cached = await caches.match(OFFLINE_URL);
					return (
						cached ||
						new Response(offlineText(), {
							status: 503,
							headers: { 'Content-Type': 'text/plain; charset=utf-8' }
						})
					);
				}
			})()
		);
		return;
	}

	// The static shell. Cache-first because these are the files whose content
	// never changes without their URL changing or the cache being retired, and
	// revalidated in the background so a deploy is picked up on the next load
	// rather than the next cache bump.
	if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/_app/immutable/')) {
		event.respondWith(
			(async () => {
				const cached = await caches.match(request);
				const network = fetch(request)
					.then(async (response) => {
						if (response && response.ok) {
							const cache = await caches.open(CACHE);
							await cache.put(request, response.clone());
						}
						return response;
					})
					.catch(() => undefined);

				// Falling back to the network result when there is nothing cached, and
				// to a plain failure when both are unavailable.
				return cached || (await network) || Response.error();
			})()
		);
	}

	// Everything else — page data (__data.json), the /api proxy, anything
	// unrecognised — is left to the browser, which is the safe default.
});

type PushPayload = { title?: string; body?: string; href?: string };

// A nudge arriving. The payload is the JSON internal/push encrypted for this
// browser: a title, a body, and the /open link that attributes the tap. A push
// with no readable payload still shows something — a silent push is how a
// subscription gets revoked on some platforms, so the worker must always
// display when it is woken.
sw.addEventListener('push', (event) => {
	let data: PushPayload;
	try {
		data = event.data ? event.data.json() : {};
	} catch {
		data = { title: 'Khepri', body: event.data ? event.data.text() : '' };
	}

	const title = data.title || 'Khepri';
	const options: NotificationOptions & { renotify?: boolean; actions?: { action: string; title: string }[] } = {
		body: data.body || '',
		icon: '/assets/brand/pwa-192.png',
		badge: '/assets/brand/pwa-192.png',
		data: { href: data.href || '/app' },
		// One notification per href: a person who has not opened the app sees the
		// latest note about a thing, not a stack of them.
		tag: data.href || 'north-nudge',
		renotify: false,
		// Answering a nudge from the lock screen. The whole point of a nudge is to
		// bring somebody back to log something, and this removes the two taps
		// between the reminder and the box.
		actions: [{ action: 'capture', title: 'Log it' }]
	};

	event.waitUntil(sw.registration.showNotification(title, options));
});

// Where a tap on a notification goes. The "Log it" action always opens the
// capture box; a tap on the body follows the link the push carried, which is
// /app/nudges/{id}/open — the server counts the open there and redirects to the
// page the nudge was about (a chat thread for a coach reply or a briefing).
// Anything that is not a same-origin path falls back to /app, so a malformed
// payload cannot send somebody off-site.
function notificationTarget(action: string, data: { href?: string } | null | undefined, origin: string): string {
	const href = action === 'capture' ? '/app/capture' : (data && data.href) || '/app';
	let url: URL;
	try {
		url = new URL(href, origin);
	} catch {
		url = new URL('/app', origin);
	}
	if (url.origin !== new URL(origin).origin) {
		url = new URL('/app', origin);
	}
	return url.href;
}

// Focus a window that already has Khepri open and send it to target, or open a
// new one. A window the worker does not control cannot be navigated (navigate
// rejects), and one that cannot be focused is no use either; both fall
// through to the next window and finally to a fresh one, so a tap always lands
// somewhere.
async function openNotificationTarget(clients: Clients, target: string) {
	const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
	for (const client of windows) {
		if (!('focus' in client) || !('navigate' in client)) continue;
		const win = client as WindowClient;
		try {
			const focused = await win.focus();
			await (focused || win).navigate(target);
			return;
		} catch {
			// Try the next window, then a new one.
		}
	}
	await clients.openWindow(target);
}

// A tap. Close the notification, then take the person to what it was about.
sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const target = notificationTarget(event.action, event.notification.data, sw.location.origin);
	event.waitUntil(openNotificationTarget(sw.clients, target));
});
