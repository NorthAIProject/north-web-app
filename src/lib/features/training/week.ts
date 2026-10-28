// The week card and its editor (north-client web/workouts/week.templ and
// internal/workouts/week_handler.go): which days train this week or next,
// and from which plan's sessions.

import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';
import type { PlanSummary, TrainingWeek, WeekRequest, WeekSession } from './types.js';
import { WEEKDAYS, weekPosition } from './weekday.js';

/** How a session is named in the editor: "<planID>:<dayIndex>" (Go: SessionValue). */
export function sessionValue(planID: string, dayIndex: number): string {
	return `${planID}:${dayIndex}`;
}

export function parseSessionValue(v: string): { planId: string; dayIndex: number } | null {
	const at = v.lastIndexOf(':');
	if (at < 0) return null;
	const dayIndex = Number.parseInt(v.slice(at + 1), 10);
	return Number.isNaN(dayIndex) ? null : { planId: v.slice(0, at), dayIndex };
}

export type SessionOption = { value: string; label: string };

/** Every session of every saved plan, for pinning a day to one. */
export function sessionOptions(plans: PlanSummary[]): SessionOption[] {
	return plans.flatMap((p) => p.days.map((d, i) => ({ value: sessionValue(p.id, i), label: `${p.name} · ${d.focus}` })));
}

/** The saved plans written for exactly n days, other than source (Go: matchingExcept). */
export function matchingExcept(plans: PlanSummary[], n: number, source: string): PlanSummary[] {
	return plans.filter((p) => p.days.length === n && n > 0 && p.id !== source);
}

/** A YYYY-MM-DD date as "Mon 2 Jan" in the reader's language; UTC keeps the calendar day. */
export function weekDate(i18n: Translator, date: string): string {
	return formatTime(i18n.locale, `${date}T00:00:00Z`, 'Mon 2 Jan', 'UTC');
}

/** key + ".this" or ".next": whole sentences, which split differently per language. */
export function weekText(i18n: Translator, key: string, nextWeek: boolean): string {
	return i18n.t(`${key}.${nextWeek ? 'next' : 'this'}`);
}

export function weekQuery(nextWeek: boolean): { week?: 'next' } {
	return nextWeek ? { week: 'next' } : {};
}

/** Today's position in the week (Monday 0), or -1 for a week not yet started. */
export function todayPosition(nextWeek: boolean, todayWeekday: string): number {
	return nextWeek ? -1 : weekPosition(todayWeekday);
}

/** Whether a weekday can no longer change: past, or already trained. */
export function isClosed(week: TrainingWeek, weekday: string, today: number): boolean {
	if (week.days.some((d) => d.weekday === weekday && d.completed)) return true;
	return WEEKDAYS.indexOf(weekday as (typeof WEEKDAYS)[number]) < today;
}

/** The days a change would keep: those trained, and those not yet past (Go: stillOpen). */
export function stillOpen(days: WeekSession[], today: number): WeekSession[] {
	return days.filter((d) => d.completed || weekPosition(d.weekday) >= today);
}

/** A session from a plan other than the one followed is worth naming. */
export function fromOtherPlan(d: WeekSession, activePlanID: string): boolean {
	return d.planId !== activePlanID;
}

/** The editor's form as the API's week request (Go: weekChangeFromForm). */
export function weekRequest(form: {
	weekdays: string[];
	planId: string;
	pins: Record<string, string>;
}): WeekRequest {
	const chosen = new Set(form.weekdays);
	const assignments: NonNullable<WeekRequest['assignments']> = [];
	for (const [weekday, value] of Object.entries(form.pins)) {
		if (!chosen.has(weekday) || !value) continue;
		const ref = parseSessionValue(value);
		if (ref) assignments.push({ weekday, planId: ref.planId, dayIndex: ref.dayIndex });
	}
	const req: WeekRequest = { weekdays: form.weekdays };
	if (form.planId) req.planId = form.planId;
	if (assignments.length > 0) req.assignments = assignments;
	return req;
}
