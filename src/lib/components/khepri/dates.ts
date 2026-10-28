// Go time layouts with month and weekday names in the reader's language: a port
// of north-client's internal/shared/i18n/dates.go (FormatTime), so a template's
// layout ("Mon 2 Jan, 15:04") carries over unchanged.
//
// Only the layout tokens the templates use are understood: January Jan Monday
// Mon 2006 06 01 1 02 _2 2 15 03 3 04 4 05 5 PM pm. Anything else is literal.

type CalendarNames = {
	months: string[];
	shortMonths: string[];
	/** Sunday first, as Go's time.Weekday counts. */
	weekdays: string[];
	shortWeekdays: string[];
};

const englishNames: CalendarNames = {
	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	shortWeekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

const spanishNames: CalendarNames = {
	months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
	shortMonths: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
	weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
	shortWeekdays: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
};

const portugueseNames: CalendarNames = {
	months: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
	shortMonths: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
	weekdays: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
	shortWeekdays: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
};

const dateNames: Record<string, CalendarNames> = {
	es: spanishNames,
	'pt-PT': portugueseNames,
	'pt-BR': portugueseNames
};

// A full month name between "de"s, and no American month-first order.
const romanceLayouts: Record<string, string> = {
	'2 January 2006': '2 de January de 2006',
	'2 January 2006, 15:04': '2 de January de 2006, 15:04',
	'2 January, 15:04': '2 de January, 15:04',
	'Jan 2': '2 Jan',
	'Jan 2, 2006 3:04 PM': '2 Jan 2006, 15:04',
	'Mon, Jan 2': 'Mon, 2 Jan',
	'Monday, January 2': 'Monday, 2 de January',
	'Monday, 2 January': 'Monday, 2 de January',
	'Monday, 2 January 2006': 'Monday, 2 de January de 2006'
};

const layoutsFor: Record<string, Record<string, string>> = {
	es: romanceLayouts,
	'pt-PT': romanceLayouts,
	'pt-BR': romanceLayouts
};

type Parts = { year: number; month: number; day: number; weekday: number; hour: number; minute: number; second: number };

const weekdayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** The wall-clock parts of t, in timeZone when given, else the runtime's zone. */
function partsOf(t: Date, timeZone?: string): Parts {
	if (!timeZone) {
		return {
			year: t.getFullYear(),
			month: t.getMonth() + 1,
			day: t.getDate(),
			weekday: t.getDay(),
			hour: t.getHours(),
			minute: t.getMinutes(),
			second: t.getSeconds()
		};
	}
	const fmt = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hourCycle: 'h23'
	});
	const get = (type: string) => fmt.formatToParts(t).find((p) => p.type === type)?.value ?? '';
	return {
		year: Number(get('year')),
		month: Number(get('month')),
		day: Number(get('day')),
		weekday: weekdayIndex[get('weekday')] ?? 0,
		hour: Number(get('hour')) % 24,
		minute: Number(get('minute')),
		second: Number(get('second'))
	};
}

const pad = (n: number) => String(n).padStart(2, '0');

const tokens: [string, (p: Parts, n: CalendarNames) => string][] = [
	// Longest first: "January" contains "Jan", "Monday" contains "Mon", "2006" contains "2".
	['January', (p, n) => n.months[p.month - 1]],
	['Monday', (p, n) => n.weekdays[p.weekday]],
	['2006', (p) => String(p.year)],
	['Jan', (p, n) => n.shortMonths[p.month - 1]],
	['Mon', (p, n) => n.shortWeekdays[p.weekday]],
	['15', (p) => pad(p.hour)],
	['01', (p) => pad(p.month)],
	['02', (p) => pad(p.day)],
	['_2', (p) => String(p.day).padStart(2, ' ')],
	['03', (p) => pad(p.hour % 12 || 12)],
	['04', (p) => pad(p.minute)],
	['05', (p) => pad(p.second)],
	['06', (p) => pad(p.year % 100)],
	['PM', (p) => (p.hour >= 12 ? 'PM' : 'AM')],
	['pm', (p) => (p.hour >= 12 ? 'pm' : 'am')],
	['1', (p) => String(p.month)],
	['2', (p) => String(p.day)],
	['3', (p) => String(p.hour % 12 || 12)],
	['4', (p) => String(p.minute)],
	['5', (p) => String(p.second)]
];

/**
 * Formats t with a Go layout, naming months and weekdays in locale's language
 * (Go: i18n.FormatTime / i18n.Date). timeZone is an IANA name; without it the
 * runtime's own zone is used.
 */
export function formatTime(locale: string, t: Date | string, layout: string, timeZone?: string): string {
	const date = typeof t === 'string' ? new Date(t) : t;
	if (Number.isNaN(date.getTime())) return '';
	const names = dateNames[locale] ?? englishNames;
	const rewritten = layoutsFor[locale]?.[layout];
	if (rewritten) layout = rewritten;
	const parts = partsOf(date, timeZone);
	let out = '';
	let i = 0;
	outer: while (i < layout.length) {
		for (const [token, render] of tokens) {
			if (layout.startsWith(token, i)) {
				out += render(parts, names);
				i += token.length;
				continue outer;
			}
		}
		out += layout[i];
		i++;
	}
	return out;
}

/** Uppercases the first character, as Go's capitalise does. */
export function capitalise(s: string): string {
	if (!s) return s;
	const first = String.fromCodePoint(s.codePointAt(0)!);
	return first.toUpperCase() + s.slice(first.length);
}
