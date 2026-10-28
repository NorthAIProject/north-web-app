// Plans store their weekdays as English names ("Monday"), the vocabulary the
// plan validator and the week rotation parse. These name them in the reader's
// language (north-client web/workouts/weekday.go). A label that is not a
// weekday — an imported plan can say "Day 1" — is shown as written.

import { capitalise } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

/** Monday first, as the week editor lists them. The values stay English. */
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const sundayFirst = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** time.Weekday of an English label (Sunday 0), or -1. */
export function parseWeekday(label: string): number {
	return sundayFirst.indexOf(label.trim().toLowerCase());
}

/** The full weekday, capitalised: it heads a card. */
export function weekdayName(i18n: Translator, label: string): string {
	const d = parseWeekday(label);
	if (d < 0) return label;
	return capitalise(i18n.t(`weekday.long.${d}`));
}

/** The abbreviated weekday, for the editor's toggles. */
export function weekdayShort(i18n: Translator, label: string): string {
	const d = parseWeekday(label);
	if (d < 0) return label;
	return i18n.t(`weekday.short.${d}`);
}

/** Monday 0 … Sunday 6; 7 for a label that is not a weekday (Go: plan.WeekPosition). */
export function weekPosition(label: string): number {
	const d = parseWeekday(label);
	return d < 0 ? 7 : (d + 6) % 7;
}

/** Today's English weekday name in timeZone. */
export function todayIn(timeZone: string | undefined, now = new Date()): string {
	try {
		return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone }).format(now);
	} catch {
		return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
	}
}
