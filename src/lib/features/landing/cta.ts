// The landing page is public, but it is not only seen by strangers: `/`
// renders for a signed-in visitor too, and must not tell them to create an
// account they already have (north-client web/landing/cta.go).

type T = (key: string) => string;

export type Cta = { signedIn: boolean; href: string; label: string };

export function cta(signedIn: boolean, t: T): Cta {
	return signedIn
		? { signedIn, href: '/app', label: t('land.cta.open') }
		: { signedIn, href: '/signup', label: t('land.cta.create') };
}

/**
 * A pricing card keeps its own wording for strangers — "Start free", "Go Pro" —
 * and says "Open Khepri" to a signed-in visitor, for whom every plan button
 * otherwise reads like a second signup.
 */
export function planCta(signedIn: boolean, label: string, t: T): string {
	return signedIn ? t('land.cta.open') : label;
}

// The store links. Each is one line to change when a listing goes live:
// appStoreURL is empty until Khepri ships, so the Apple badge points at the
// TestFlight invite and says so underneath; Android has no build yet, so the
// Play badge renders muted and is not a link.
export const appStoreURL = '';
export const iosBetaURL = 'https://testflight.apple.com/join/MCwG7x6H';
export const playStoreURL = '';

export type StoreBadge = { href?: string; caption?: string; aria: string; muted?: boolean };

/** A real listing wins; a TestFlight invite links with a beta caption; nothing mutes the badge. */
export function appleBadge(t: T, listing = appStoreURL, beta = iosBetaURL): StoreBadge {
	if (listing) return { href: listing, aria: t('land.app.ios.store.aria') };
	if (beta) return { href: beta, caption: t('land.app.beta'), aria: t('land.app.ios.aria') };
	return { caption: t('land.app.soon'), aria: t('land.app.ios.soon.aria'), muted: true };
}

export function playBadge(t: T, listing = playStoreURL): StoreBadge {
	if (listing) return { href: listing, aria: t('land.app.android.store.aria') };
	return { caption: t('land.app.soon'), aria: t('land.app.android.aria'), muted: true };
}
