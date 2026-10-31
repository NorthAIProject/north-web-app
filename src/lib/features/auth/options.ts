import type { Api } from '#lib/api/client.js';
import type { components } from '#lib/api/generated/schema.js';

// Which optional sign-in methods north-client has configured (GET
// /auth/options), so a page only offers what works — the Go handler's
// formOpts(). Google needs a client secret, passkeys a relying party, and the
// reset link a mailer that can deliver.
export type AuthOptions = components['schemas']['AuthOptionsResponse'];

export const noAuthOptions: AuthOptions = { google: false, passkey: false, passwordReset: false };

/**
 * The options, or every optional method off when the API cannot say. A page
 * that fails to learn about Google should still offer the password form.
 */
export async function fetchAuthOptions(api: Api): Promise<AuthOptions> {
	return (await fetchAuthOptionsOrUnknown(api)) ?? noAuthOptions;
}

/**
 * The options, or null when the API could not say. A page that hides itself
 * when a method is off (the password-reset pages) must tell "off" from
 * "unknown": a blip in GET /auth/options should not turn the reset journey,
 * or an emailed reset link, into a 404.
 */
export async function fetchAuthOptionsOrUnknown(api: Api): Promise<AuthOptions | null> {
	try {
		const { data } = await api.GET('/auth/options');
		return data ?? null;
	} catch {
		return null;
	}
}

/** False only when the API said there is no mailer to send the reset link. */
export function passwordResetOffered(options: AuthOptions | null): boolean {
	return options === null || options.passwordReset;
}

/** The Google entry point, carrying next the way Go's googleAuthHref did. */
export function googleHref(next?: string | null): string {
	return next ? `/auth/google?next=${encodeURIComponent(next)}` : '/auth/google';
}

/**
 * Message keys for a Google round trip that came back to /login?google=<reason>.
 * Go rendered the login page in place from its callback; here the callback is
 * a +server.ts that redirects, so the reason travels in the query.
 */
export const googleErrorKeys: Record<string, string> = {
	denied: 'auth.err.google.denied',
	expired: 'auth.err.google.expired',
	state: 'auth.err.google.state',
	failed: 'auth.err.google.failed',
	unavailable: 'auth.err.google.unavailable'
};
