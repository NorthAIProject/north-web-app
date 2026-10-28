// The locales Khepri serves, mirroring north-client's internal/shared/i18n.
// English is the reference catalogue; every other one carries the same keys.

export const locales = ['en', 'pt-PT', 'pt-BR', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** The cookie a signed-out visitor's language choice lives in (same name as Go). */
export const localeCookie = 'locale';

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Locales that write "72,5 kg" rather than "72.5 kg". */
export function usesDecimalComma(locale: string): boolean {
	return locale === 'es' || locale === 'pt-PT' || locale === 'pt-BR';
}

/**
 * Picks a served locale from an Accept-Language header. Matches Go's
 * language.Matcher closely enough for the four tags served: a bare "pt" is
 * Brazilian (as CLDR has it), any other Portuguese region is European.
 */
export function negotiate(header: string | null | undefined): Locale {
	if (!header) return defaultLocale;
	const ranked = header
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().split(';');
			const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
			return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1 };
		})
		.filter((entry) => entry.tag && entry.q > 0)
		.sort((a, b) => b.q - a.q);

	for (const { tag } of ranked) {
		const [lang, region] = tag.split('-');
		if (lang === 'en') return 'en';
		if (lang === 'es') return 'es';
		if (lang === 'pt') return !region || region === 'br' ? 'pt-BR' : 'pt-PT';
	}
	return defaultLocale;
}
