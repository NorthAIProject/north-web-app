// The care page's wording, ported from north-client web/care/care.templ and
// medications.templ (the helpers next to the templates there).

import type { Translator } from '#lib/i18n/index.js';
import type { BadgeVariant } from '#lib/components/ui/badge/index.js';
import type { components } from '#lib/api/generated/schema.js';

export type Care = components['schemas']['Care'];
export type CareHabit = Care['habits'][number];
export type CareReminder = Care['reminders'][number];
export type Medications = components['schemas']['Medications'];
export type Medication = components['schemas']['Medication'];

/** hydration.QuickAmounts: a glass, a bottle, a litre. */
export const quickAmounts = [250, 500, 1000] as const;

/** lifedomain.Domains, in the order the habit form offers them. */
export const domains = ['fitness', 'health', 'work', 'learning', 'personal', 'other'] as const;

/** Sunday (0) to Saturday (6), as Go's time.Weekday. */
export const weekdays = [0, 1, 2, 3, 4, 5, 6] as const;

/** The three-letter weekday name (Go: weekdayLabel). */
export function weekdayLabel(i18n: Translator, d: number): string {
	if (d < 0 || d > 6) return '';
	return i18n.t('weekday.short.' + d);
}

/** "Every day" or "Mon, Wed" (Go: daysSummary). */
export function daysSummary(i18n: Translator, days: number[]): string {
	if (days.length === 7) return i18n.t('care.rem.everyday');
	return days
		.map((d) => weekdayLabel(i18n, d))
		.filter((label) => label !== '')
		.join(', ');
}

/** A habit's days in week order (Go: habitSchedule). */
export function habitSchedule(i18n: Translator, days: number[]): string {
	if (days.length === 7) return i18n.t('care.rem.everyday');
	return daysSummary(
		i18n,
		weekdays.filter((d) => days.includes(d))
	);
}

/** "1 day streak" has a singular in every language (Go: habitStreak). */
export function habitStreak(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('care.habits.streak.one') : i18n.tf('care.habits.streak.many', n);
}

/** A life domain's name, or the stored value when this build does not know it. */
export function domainLabel(i18n: Translator, domain: string): string {
	return (domains as readonly string[]).includes(domain) ? i18n.t('lifedomain.' + domain) : domain;
}

export function litres(i18n: Translator, ml: number): string {
	return i18n.decimal(ml / 1000, 1) + 'L';
}

export function amountLabel(i18n: Translator, ml: number): string {
	return ml >= 1000 ? litres(i18n, ml) : `${ml}ml`;
}

/** hydration.Day.Percent: capped at 100. */
export function waterPercent(total: number, target: number): number {
	if (target <= 0) return 0;
	return Math.min(100, Math.floor((total * 100) / target));
}

/** sleep.Log.Duration: "7h" or "7h 30m". */
export function sleepDuration(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const knownStatuses = ['taken', 'skipped', 'due', 'upcoming'];

/** A dose status in the reader's language; an unknown one shown as sent. */
export function slotStatusLabel(i18n: Translator, status: string): string {
	return knownStatuses.includes(status) ? i18n.t('care.meds.status.' + status) : status;
}

export function slotBadge(status: string): BadgeVariant {
	if (status === 'taken') return 'default';
	if (status === 'due') return 'destructive';
	return 'secondary';
}

/** "Metformin 500 mg", or just the name (Go: Medication.Label). */
export function medicationLabel(m: { name: string; dose: string }): string {
	return m.dose === '' ? m.name : `${m.name} ${m.dose}`;
}

export function medicationSchedule(i18n: Translator, m: Medication): string {
	if (m.asNeeded) return i18n.t('care.meds.asneeded');
	return m.times.join(', ') + ' · ' + daysSummary(i18n, m.daysOfWeek);
}

/** The times field as typed, split the way medications.splitTimes does. */
export function splitTimes(raw: string): string[] {
	return raw.split(/[,; ]+/).filter((t) => t !== '');
}
