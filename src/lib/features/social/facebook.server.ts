// The Facebook web flow's state cookie (Go: facebookStateCookie and
// facebookCookiePath in internal/social/handler_finding.go). The state lives in
// an HttpOnly cookie so the callback can prove the response belongs to a flow
// this browser started, as Go does.

export const facebookStateCookie = 'north_facebook_oauth';
export const facebookCookiePath = '/app/friends/facebook';

const results = ['connected', 'cancelled', 'expired', 'taken', 'failed'] as const;
export type FacebookResult = (typeof results)[number];

/** Where the callback sends the browser: the Friends page with how it went. */
export function facebookReturn(result: FacebookResult): string {
	return '/app/friends?' + new URLSearchParams({ facebook: result }).toString() + '#facebook';
}

/** Constant-time string comparison (Go: subtle.ConstantTimeCompare). */
export function sameState(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}
