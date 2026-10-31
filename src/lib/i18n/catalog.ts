import type { Locale } from './locales';

export type Messages = Record<string, string>;

// One chunk per locale: a browser downloads only the catalogue it reads, once,
// and caches it with the rest of the immutable build output.
const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
	en: () => import('./catalogs/en.json'),
	es: () => import('./catalogs/es.json'),
	'pt-PT': () => import('./catalogs/pt-PT.json'),
	'pt-BR': () => import('./catalogs/pt-BR.json')
};

/**
 * The locale's catalogue, and the one a missing key falls back to. Every
 * catalogue carries every key (catalog.spec.ts), so that is the same one: an
 * es or pt reader no longer downloads the English catalogue (~58 KB gz) as
 * well, only for it never to be read.
 */
export async function loadMessages(locale: Locale): Promise<{ messages: Messages; fallback: Messages }> {
	const own = (await loaders[locale]()).default;
	return { messages: own, fallback: own };
}
