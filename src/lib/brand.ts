// Product constants, mirroring north-client's web/shared/ui/brand.go.
export const productName = 'Khepri';
export const siteUrl = 'https://kheprios.com';
export const tagline = 'An AI operating system for personal growth.';
export const xProfileUrl = 'https://x.com/fatc88';
export const discordUrl = 'https://discord.gg/FHHhFUk9e';

/** "Goals · Khepri" — identifiable among a dozen tabs. */
export function pageTitle(title?: string): string {
	return title ? `${title} · ${productName}` : productName;
}
