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

export async function loadMessages(locale: Locale): Promise<{ messages: Messages; fallback: Messages }> {
	const [own, english] = await Promise.all([loaders[locale](), locale === 'en' ? null : loaders.en()]);
	return { messages: own.default, fallback: english ? english.default : own.default };
}
