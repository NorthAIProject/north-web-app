// What the browser's analytics may do on a page: a port of north-client
// web/shared/analytics (Resolve). Pure: the caller passes the configured key
// and host and the visitor's identity; nothing here reads env or cookies.

export type AnalyticsConfig = {
	apiKey: string;
	host: string;
	/** Distinct id for a signed-in person; omitted for visitors. */
	identity?: string;
	/** Click autocapture, only on the public funnel pages. */
	autocapture: boolean;
	/** Session recording, only on the landing page and OAuth consent. */
	record: boolean;
	/** Keep the query string (UTM) — only on the landing page. */
	keepQuery: boolean;
};

const autocapturePages = new Set(['/', '/signup', '/login', '/privacy', '/terms', '/oauth/authorize']);
const recordPages = new Set(['/', '/oauth/authorize']);

/** The request path without query, fragment or trailing slash. */
export function pathOf(requestURI: string): string {
	let path = requestURI;
	const i = path.search(/[?#]/);
	if (i >= 0) path = path.slice(0, i);
	if (path.length > 1) path = path.replace(/\/$/, '');
	return path || '/';
}

/** Resolves the page's analytics config; an empty apiKey means disabled. */
export function resolveAnalytics(opts: { apiKey?: string; host?: string; identity?: string; path: string }): AnalyticsConfig {
	if (!opts.apiKey) return { apiKey: '', host: '', autocapture: false, record: false, keepQuery: false };
	const path = pathOf(opts.path);
	return {
		apiKey: opts.apiKey,
		host: opts.host ?? '',
		identity: opts.identity || undefined,
		autocapture: autocapturePages.has(path),
		record: recordPages.has(path),
		keepQuery: path === '/'
	};
}

export function analyticsEnabled(c: AnalyticsConfig): boolean {
	return c.apiKey !== '';
}
