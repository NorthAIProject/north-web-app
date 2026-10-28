import { formatDecimal, formatThousands, sprintf } from './format';
import type { Messages } from './catalog';
import type { Locale } from './locales';

export type Translator = {
	readonly locale: Locale;
	/** The key's text, falling back to English and then to the key itself (as Go's i18n.T). */
	t(key: string): string;
	/** t with Go-style formatting: tf('goals.count', 3). */
	tf(key: string, ...args: unknown[]): string;
	/** True when the catalogue has the key (Go templates sometimes branch on it). */
	has(key: string): boolean;
	decimal(value: number, precision: number): string;
	thousands(value: number): string;
};

export function createTranslator(locale: Locale, messages: Messages, fallback: Messages): Translator {
	const lookup = (key: string) => messages[key] || fallback[key] || key;
	return {
		locale,
		t: lookup,
		tf: (key, ...args) => sprintf(locale, lookup(key), args),
		has: (key) => key in messages || key in fallback,
		decimal: (value, precision) => formatDecimal(locale, value, precision),
		thousands: (value) => formatThousands(locale, value)
	};
}
