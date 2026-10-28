import { createContext } from 'svelte';
import type { Translator } from './translator';

export { createTranslator, type Translator } from './translator';
export { loadMessages, type Messages } from './catalog';
export * from './locales';
export { sprintf, formatDecimal, formatThousands } from './format';

// Components read the translator from context rather than a module singleton:
// on the server one process renders many requests in many languages at once,
// and a shared module value would leak one visitor's language into another's.
const [getI18n, setI18n] = createContext<() => Translator>();

export { setI18n };

/**
 * The request's translator. Call during component initialisation:
 *
 *	const i18n = useI18n();
 *	<h1>{i18n.t('goals.title')}</h1>
 *	<p>{i18n.tf('goals.count', goals.length)}</p>
 *
 * Every method reads the current catalogue when called, so a language change
 * (settings save → invalidateAll) re-renders with the new one.
 */
export function useI18n(): Translator {
	const current = getI18n();
	return {
		get locale() {
			return current().locale;
		},
		t: (key) => current().t(key),
		tf: (key, ...args) => current().tf(key, ...args),
		has: (key) => current().has(key),
		decimal: (value, precision) => current().decimal(value, precision),
		thousands: (value) => current().thousands(value)
	};
}
