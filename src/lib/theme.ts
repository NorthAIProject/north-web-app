// Appearance mirrors north-client's internal/shared/theme: the account's
// stored choice wins, then a signed-out visitor's cookie, then dark.

export const appearances = ['system', 'light', 'dark'] as const;
export type Appearance = (typeof appearances)[number];
export const defaultAppearance: Appearance = 'dark';
export const appearanceCookie = 'appearance';

export function isAppearance(value: unknown): value is Appearance {
	return typeof value === 'string' && (appearances as readonly string[]).includes(value);
}

// Warm Ivory and Obsidian Navy, the --background of each mode.
export const themeColorLight = '#F6F2EA';
export const themeColorDark = '#0B111C';
