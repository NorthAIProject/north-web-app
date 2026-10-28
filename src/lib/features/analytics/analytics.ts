// What the browser is allowed to report on the page being viewed: a port of
// north-client web/shared/analytics (the decisions) and
// web/assets/js/shared/analytics.js (the posthog.init call).
//
// Go decided per full page load. Here the app navigates on the client, so
// each decision is made against the page the reader is on at the moment it
// matters: the autocapture allowlist and the query stripping are evaluated
// per event, and replay is started and stopped as the reader moves between
// pages. The lists stay here, tested, rather than in the component.

/**
 * The signed-out pages where recording which element somebody clicked is safe
 * and useful. Deliberately a fixed set rather than "anything outside /app": the
 * password reset pages are signed out too, and their URLs carry a single-use
 * token that must not reach an analytics property.
 */
export const autocapturePages: ReadonlySet<string> = new Set([
	'/',
	'/signup',
	'/login',
	'/privacy',
	'/terms',
	'/oauth/authorize'
]);

/**
 * The pages where session replay is on. Two, and both signed out: the privacy
 * policy promises that no page reached after signing in is ever recorded.
 */
export const recordPages: ReadonlySet<string> = new Set(['/', '/oauth/authorize']);

/** One spelling of a page: no query, no fragment, no trailing slash. */
export function pathOf(uri: string): string {
	let path = uri;
	const cut = path.search(/[?#]/);
	if (cut >= 0) path = path.slice(0, cut);
	if (path.length > 1) path = path.replace(/\/$/, '');
	return path || '/';
}

export const shouldRecord = (path: string) => recordPages.has(pathOf(path));

/**
 * The landing page only keeps its query: it is the campaign that brought
 * somebody (utm_source, a ref code). Everywhere else the query is a liability —
 * /oauth/authorize carries a request_id, /reset-password a single-use token.
 */
export const keepsQuery = (path: string) => pathOf(path) === '/';

/**
 * posthog's autocapture url_allowlist: regexes matched against location.href
 * at click time, so the set above holds after client-side navigation too.
 */
export function autocaptureAllowlist(): string[] {
	const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
	return [...autocapturePages].map((p) => `^https?://[^/]+${p === '/' ? '' : escape(p)}/?(?:[?#].*)?$`);
}

const urlKeys = ['$current_url', '$referrer', '$initial_current_url'] as const;

/**
 * Strips the query string out of the URL properties PostHog derives from
 * location, unless the page being viewed may keep it. Applied to those keys
 * rather than the whole object, so a deliberately-sent property is left alone.
 */
export function sanitize(properties: Record<string, unknown>, keepQuery: boolean): Record<string, unknown> {
	if (keepQuery) return properties;
	for (const key of urlKeys) {
		const value = properties[key];
		if (typeof value === 'string') {
			const cut = value.search(/[?#]/);
			if (cut >= 0) properties[key] = value.slice(0, cut);
		}
	}
	return properties;
}

/** The part of posthog-js this app calls. */
export type PostHog = {
	init(key: string, config: Record<string, unknown>): void;
	identify(id: string): void;
	capture(event: string, properties?: Record<string, unknown>): void;
	register(properties: Record<string, unknown>): void;
	startSessionRecording(): void;
	stopSessionRecording(): void;
};

declare global {
	interface Window {
		posthog?: PostHog;
	}
}

/** Reports an event when analytics is on; a no-op otherwise. */
export function capture(event: string, properties?: Record<string, unknown>) {
	if (typeof window !== 'undefined') window.posthog?.capture(event, properties);
}

/** The posthog.init configuration, given the reader's current location. */
export function posthogConfig(host: string, currentPath: () => string): Record<string, unknown> {
	return {
		api_host: host,
		// Anonymous landing traffic creates no person record. A person appears at
		// identify, which is the moment there is an account to attach one to.
		person_profiles: 'identified_only',
		// Captured by hand on every navigation (the Go pages were full loads).
		capture_pageview: false,
		capture_pageleave: true,
		autocapture: { url_allowlist: autocaptureAllowlist() },
		// Replay is started explicitly when the page allows it, never by
		// configuration — so a page that was not meant to be recorded cannot be
		// recorded by forgetting a flag.
		disable_session_recording: true,
		mask_all_inputs: true,
		// The vendored bundle still carries one loader that would fetch the
		// PostHog toolbar from their CDN. Nothing may reach a third-party origin
		// at runtime; this is the switch that holds the line.
		disable_external_dependency_loading: true,
		sanitize_properties: (properties: Record<string, unknown>) => sanitize(properties, keepsQuery(currentPath()))
	};
}
