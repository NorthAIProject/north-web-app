// View helpers for the activity timer page (north-client web/activity/activity.templ
// and internal/activity/handler.go's form parsing).

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

export type ActivitySession = components['schemas']['ActivitySession'];
export type ActivityKind = components['schemas']['ActivityKind'];

/**
 * The activity's name in the reader's language. The MET table's English name
 * is the fallback, so an entry added before the catalogue still reads as a
 * word rather than a key (Go: metName).
 */
export function metName(i18n: Translator, code: string, english: string): string {
	const key = `activity.met.${code}`;
	const got = i18n.t(key);
	return got !== key ? got : english;
}

/** Go: activityName — the code itself when the MET table does not know it. */
export function activityName(
	i18n: Translator,
	s: { activityCode: string; activityName: string }
): string {
	return metName(i18n, s.activityCode, s.activityName);
}

/** "32 min" (Go: formatMinutes, rounding to the nearest minute). */
export function formatMinutes(seconds: number): string {
	return `${Math.round(seconds / 60)} min`;
}

/** "5:32", as runners say it (Go: formatPace, rounded to the second). */
export function formatPace(secondsPerKm: number): string {
	const s = Math.round(secondsPerKm);
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The one line a finished session reads as: when, how long, how far and at
 * what pace when known, and the burn (Go: sessionSummary). elapsedSeconds of
 * an ended session is its moving time at the end.
 */
export function sessionSummary(i18n: Translator, s: ActivitySession, timeZone: string): string {
	let out = formatTime(i18n.locale, s.startedAt, '2 Jan', timeZone);
	if (s.endedAt) out += ' · ' + formatMinutes(s.elapsedSeconds);
	if (s.distanceM && s.distanceM > 0) {
		out += ' · ' + i18n.decimal(s.distanceM / 1000, 1) + ' km';
		if (s.endedAt && s.elapsedSeconds > 0)
			out += ' · ' + formatPace(s.elapsedSeconds / (s.distanceM / 1000)) + ' /km';
	}
	if (s.caloriesBurned !== undefined && s.caloriesBurned !== null) {
		out += ` · ~${s.caloriesBurned.toFixed(0)} kcal`;
	}
	return out;
}

export type LogForm = {
	activityCode: string;
	minutes: string;
	distanceKm: string;
	startedAt: string;
};

export type ParsedLog = {
	activityCode: string;
	durationMinutes: number;
	distanceKm?: number;
	startedAt?: string;
};

/**
 * Reads the "log a finished session" form, which speaks in minutes,
 * kilometres and the person's wall clock (Go: parseLogForm). Throws the same
 * messages the Go handler shows.
 */
export function parseLogForm(form: LogForm, timeZone: string): ParsedLog {
	const minutes = Number.parseInt(form.minutes.trim(), 10);
	if (!/^\d+$/.test(form.minutes.trim()) || !Number.isFinite(minutes) || minutes <= 0) {
		throw new Error('say how many minutes the session lasted');
	}
	const out: ParsedLog = { activityCode: form.activityCode, durationMinutes: minutes };

	const rawKm = form.distanceKm.trim();
	if (rawKm !== '') {
		const km = Number(rawKm);
		if (!Number.isFinite(km)) throw new Error('distance must be a number of kilometres');
		out.distanceKm = km;
	}

	const rawStart = form.startedAt.trim();
	if (rawStart !== '') {
		const instant = wallClockToInstant(rawStart, timeZone);
		if (!instant) throw new Error('start time must be a date and time');
		out.startedAt = instant.toISOString();
	}
	return out;
}

/**
 * A <input type="datetime-local"> value ("2006-01-02T15:04", no zone) read in
 * timeZone, as Go's time.ParseInLocation does. Null when it is not one.
 */
export function wallClockToInstant(value: string, timeZone: string): Date | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
	if (!m) return null;
	const [y, mo, d, h, mi] = m.slice(1).map(Number);
	if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
	const asUTC = Date.UTC(y, mo - 1, d, h, mi);
	// The zone's offset at that wall time, found by asking what wall time the
	// guessed instant shows there; a second pass settles DST edges.
	let guess = asUTC;
	for (let i = 0; i < 2; i++) guess = asUTC - offsetAt(guess, timeZone);
	const date = new Date(guess);
	return Number.isNaN(date.getTime()) ? null : date;
}

function offsetAt(instant: number, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	}).formatToParts(new Date(instant));
	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
	const wall = Date.UTC(
		get('year'),
		get('month') - 1,
		get('day'),
		get('hour') % 24,
		get('minute'),
		get('second')
	);
	return wall - Math.floor(instant / 1000) * 1000;
}
