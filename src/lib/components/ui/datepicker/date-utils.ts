/** ISO (yyyy-mm-dd) date helpers shared by the calendar and date picker; all maths is in UTC like templUI's calendar.js. */
export function parseISODate(iso: string | null | undefined): Date | null {
	if (!iso) return null;
	const parts = iso.split("-");
	if (parts.length !== 3) return null;
	const [y, m, d] = parts.map((p) => parseInt(p, 10));
	const date = new Date(Date.UTC(y, m - 1, d));
	return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
		? date
		: null;
}

export function toISODate(date: Date | null | undefined): string {
	return date ? date.toISOString().split("T")[0] : "";
}

export type DateFormat = "locale-short" | "locale-medium" | "locale-long" | "locale-full";

export function formatDate(date: Date | null, format: DateFormat, locale: string): string {
	if (!date || isNaN(date.getTime())) return "";
	const dateStyle = ({
		"locale-short": "short",
		"locale-medium": "medium",
		"locale-long": "long",
		"locale-full": "full",
	} as const)[format] ?? "medium";
	try {
		return new Intl.DateTimeFormat(locale, { timeZone: "UTC", dateStyle }).format(date);
	} catch {
		return toISODate(date);
	}
}

export function monthNames(locale: string): string[] {
	try {
		const fmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
		return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2000, i, 1))));
	} catch {
		return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	}
}

export function dayNames(locale: string, startOfWeek: number): string[] {
	try {
		const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
		// 2000-01-02 is a Sunday.
		return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2000, 0, i + 2 + startOfWeek))));
	} catch {
		const names = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
		return Array.from({ length: 7 }, (_, i) => names[(i + startOfWeek) % 7]);
	}
}
