import { usesDecimalComma } from './locales';

// A Go fmt.Sprintf subset, because the catalogues are shared with north-client
// and written for it: "%[1]s", "%d", "%.1f", "%q", "%g", "%v", "%%".
//
// Float arguments come out with the locale's decimal separator, as Go's
// i18n.localizeArgs does. Integers and strings are untouched.

// Go takes an explicit argument index either right after the % ("%[1].1f") or
// right before the verb ("%.1[1]f"); the catalogues use both.
const verb = /%(?:\[(\d+)\])?([-+# 0]*)(\d+)?(?:\.(\d+))?(?:\[(\d+)\])?([sdvqgfeTt%])/g;

export function sprintf(locale: string, format: string, args: unknown[]): string {
	let next = 0;
	return format.replace(verb, (match, lead, _flags, _width, precision, trail, kind: string) => {
		if (kind === '%') return '%';
		const index = trail ?? lead;
		const at = index ? Number(index) - 1 : next;
		next = at + 1;
		if (at >= args.length) return `%!${kind}(MISSING)`;
		return formatArg(locale, args[at], kind, precision === undefined ? undefined : Number(precision));
	});
}

function formatArg(locale: string, value: unknown, kind: string, precision?: number): string {
	switch (kind) {
		case 'd':
			return typeof value === 'number' ? String(Math.trunc(value)) : String(value);
		case 'f':
		case 'e':
			return localizeNumber(locale, typeof value === 'number' ? toFixedGo(value, precision ?? 6) : String(value));
		case 'g':
			return localizeNumber(
				locale,
				typeof value === 'number'
					? precision === undefined
						? String(value)
						: String(Number(value.toPrecision(precision)))
					: String(value)
			);
		case 'q':
			return JSON.stringify(String(value));
		case 't':
			return String(Boolean(value));
		case 'T':
			return typeof value;
		case 's':
		case 'v':
		default:
			if (typeof value === 'number' && !Number.isInteger(value)) return localizeNumber(locale, String(value));
			return String(value);
	}
}

/**
 * toFixed with Go's tie rule: strconv rounds an exact half to even (2712.5 →
 * "2712"), where toFixed rounds it away from zero ("2713"). Only exact ties
 * differ, so everything else is toFixed's own answer.
 */
export function toFixedGo(value: number, precision: number): string {
	const scale = 10 ** precision;
	const magnitude = Math.abs(value);
	const floor = Math.floor(magnitude * scale);
	if ((floor + 0.5) / scale !== magnitude) return value.toFixed(precision);
	const even = floor % 2 === 0 ? floor : floor + 1;
	return (value < 0 && even !== 0 ? '-' : '') + (even / scale).toFixed(precision);
}

function localizeNumber(locale: string, formatted: string): string {
	return usesDecimalComma(locale) ? formatted.replace('.', ',') : formatted;
}

/** Formats v to prec decimals with the locale's separator (Go: i18n.FormatDecimal). */
export function formatDecimal(locale: string, value: number, precision: number): string {
	return localizeNumber(locale, toFixedGo(value, precision));
}

/** Groups thousands with the locale's mark (Go: i18n.FormatThousands). */
export function formatThousands(locale: string, value: number): string {
	const sep = usesDecimalComma(locale) ? '.' : ',';
	const sign = value < 0 ? '-' : '';
	const digits = String(Math.abs(Math.trunc(value)));
	return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}
