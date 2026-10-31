import type { Translator } from '#lib/i18n/index.js';

/**
 * What an error page says for a status and the message thrown with it.
 *
 * The title and reason always come from this locale's catalogue, so a
 * Spanish visitor never reads "Internal Error". Thrown messages come from
 * three places: SvelteKit's own ("Internal Error", "Not Found"), raw English
 * left in load functions ("Not found."), and messages already localised
 * through serverI18n. The generic ones are dropped; anything more specific is
 * kept as a detail line under the reason.
 */
export type ErrorView = { title: string; reason: string; detail?: string };

// Lower-cased, trailing full stop removed.
const generic = new Set([
	'internal error',
	'not found',
	'that request could not be read',
	'the server could not answer this request'
]);

export function errorView(i18n: Translator, status: number, message?: string | null): ErrorView {
	const kind = status === 404 ? 'notfound' : status >= 500 ? 'server' : 'request';
	const raw = (message ?? '').trim();
	const isGeneric = !raw || generic.has(raw.toLowerCase().replace(/\.$/, ''));
	return {
		title: i18n.t(`layout.error.${kind}.title`),
		reason: i18n.t(`layout.error.${kind}.reason`),
		...(isGeneric ? {} : { detail: raw })
	};
}
