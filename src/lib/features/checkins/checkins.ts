// Check-in view helpers: a port of north-client web/checkins/checkins.templ's
// Go functions and internal/checkins/series.go (BuildChartSeries, Averages),
// with the same catalogue keys.

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

export type CheckIn = components['schemas']['CheckIn'];
export type CheckInList = components['schemas']['CheckInList'];
export type SavedCheckIn = components['schemas']['SavedCheckIn'];
export type WeekDay = components['schemas']['CheckInWeekDay'];
export type Moment = components['schemas']['CheckInMoment'];

/** checkin.Run as the saved panel reads it. */
export type Run = {
	current: number;
	best: number;
	previousRun: number;
	restsHeld: number;
	restsUsed: number;
	perfectWeek: boolean;
	week: WeekDay[];
};

/** contextDays: the chart and KPI window. */
export const CONTEXT_DAYS = 14;

/** defaultScale: where mood and energy start on a blank check-in. */
export const DEFAULT_SCALE = 3;

export function runFrom(list: CheckInList): Run {
	return {
		current: list.streak,
		best: list.bestStreak,
		previousRun: list.previousRun ?? 0,
		restsHeld: list.restDaysHeld,
		restsUsed: list.restDaysUsed,
		perfectWeek: list.perfectWeek,
		week: list.week
	};
}

/** Today's calendar day in timeZone, YYYY-MM-DD. */
export function localToday(timeZone: string, now: Date = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(now);
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
	return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDays(day: string, n: number): string {
	const d = new Date(`${day}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

/**
 * RecentForContext: the check-ins of the trailing fourteen calendar days, at
 * most fourteen, newest first (the API's recent list is newest first).
 */
export function recentForContext(recent: CheckIn[], timeZone: string, now: Date = new Date()): CheckIn[] {
	const since = addDays(localToday(timeZone, now), -(CONTEXT_DAYS - 1));
	return recent.filter((c) => c.localDate >= since).slice(0, CONTEXT_DAYS);
}

export type ChartDay = { label: string; mood: number; energy: number };

/**
 * BuildChartSeries: one entry per trailing calendar day, zero where there was
 * no check-in. Go labels with time.Format("2 Jan"), which is always English.
 */
export function chartSeries(list: CheckIn[], timeZone: string, now: Date = new Date()): ChartDay[] {
	const today = localToday(timeZone, now);
	const byDate = new Map(list.map((c) => [c.localDate, c]));
	const out: ChartDay[] = [];
	for (let i = CONTEXT_DAYS - 1; i >= 0; i--) {
		const day = addDays(today, -i);
		const c = byDate.get(day);
		out.push({ label: formatTime('en', day, '2 Jan', 'UTC'), mood: c?.mood ?? 0, energy: c?.energy ?? 0 });
	}
	return out;
}

export function hasData(days: ChartDay[]): boolean {
	return days.some((d) => d.mood > 0 || d.energy > 0);
}

/** Averages: mean mood and energy, and how many check-ins they come from. */
export function averages(list: CheckIn[]): { mood: number; energy: number; count: number } {
	if (list.length === 0) return { mood: 0, energy: 0, count: 0 };
	const mood = list.reduce((s, c) => s + c.mood, 0);
	const energy = list.reduce((s, c) => s + c.energy, 0);
	return { mood: mood / list.length, energy: energy / list.length, count: list.length };
}

/** The instruments the check-ins and mind headers show. */
export type Instruments = {
	days: ChartDay[];
	hasData: boolean;
	avgMood: number;
	avgEnergy: number;
	count: number;
};

export function instrumentsFor(recent: CheckIn[], timeZone: string, now: Date = new Date()): Instruments {
	const list = recentForContext(recent, timeZone, now);
	const days = chartSeries(list, timeZone, now);
	const avg = averages(list);
	return { days, hasData: hasData(days), avgMood: avg.mood, avgEnergy: avg.energy, count: avg.count };
}

export function avgKPI(i18n: Translator, value: number, count: number): string {
	return count <= 0 ? '—' : `${i18n.decimal(value, 1)}/5`;
}

export function streakKPI(i18n: Translator, streak: number): string {
	if (streak <= 0) return '—';
	if (streak === 1) return i18n.t('checkins.kpi.streak.one');
	return i18n.tf('checkins.kpi.streak.many', streak);
}

export function checkInCountKPI(i18n: Translator, count: number): string {
	if (count <= 0) return '—';
	if (count === 1) return i18n.t('checkins.kpi.count.one');
	return i18n.tf('checkins.kpi.count.many', count);
}

/** checkinLabel: "Mon 27 Oct — mood 4 · energy 3". */
export function checkinLabel(i18n: Translator, c: Pick<CheckIn, 'localDate' | 'mood' | 'energy'>): string {
	return i18n.tf('checkins.label', formatTime(i18n.locale, c.localDate, 'Mon 2 Jan', 'UTC'), c.mood, c.energy);
}

/** ClockIn: HH:MM in the person's zone. */
export function clockIn(t: string, timeZone: string): string {
	return formatTime('en', t, '15:04', timeZone || 'UTC');
}

const EDITED_AFTER_MS = 2 * 60 * 1000;

/** CheckIn.Edited: changed notably after it was first saved. */
export function edited(c: Pick<CheckIn, 'createdAt' | 'updatedAt'>): boolean {
	return Date.parse(c.updatedAt) - Date.parse(c.createdAt) > EDITED_AFTER_MS;
}

/** entryTimes: when it was logged, and when last edited if notably later. */
export function entryTimes(i18n: Translator, c: CheckIn, timeZone: string): string {
	let out = i18n.tf('checkins.meta.at', clockIn(c.createdAt, timeZone));
	if (edited(c)) out += ' · ' + i18n.tf('checkins.meta.edited', clockIn(c.updatedAt, timeZone));
	return out;
}

const labelledSources = ['web', 'ios', 'siri', 'coach', 'mcp', 'capture'];

/** SourceLabel: unknown and unrecognised sources get no label. */
export function sourceLabel(i18n: Translator, source: string): string {
	return labelledSources.includes(source) ? i18n.t(`checkins.source.${source}`) : '';
}

function streakSaved(i18n: Translator, streak: number): string {
	if (streak === 1) return i18n.t('checkins.streak.saved.one');
	return i18n.tf('checkins.streak.saved.many', streak);
}

/** runLine: the streak line under a saved check-in. */
export function runLine(i18n: Translator, run: Run): string {
	if (run.current === 1 && run.previousRun >= 3) return i18n.tf('checkins.streak.newrun', run.best);
	let line = streakSaved(i18n, run.current);
	if (run.restsUsed === 1) line += ' · ' + i18n.t('checkins.rests.used.one');
	else if (run.restsUsed > 1) line += ' · ' + i18n.tf('checkins.rests.used.many', run.restsUsed);
	return line;
}

export function restsHeld(i18n: Translator, n: number): string {
	if (n === 1) return i18n.t('checkins.rests.held.one');
	return i18n.tf('checkins.rests.held.many', n);
}

const knownStates = ['checked', 'rest', 'today', 'upcoming'];

export function dayStateLabel(i18n: Translator, state: string): string {
	return i18n.t(knownStates.includes(state) ? `checkins.week.${state}` : 'checkins.week.none');
}

/** dotClass: a perfect week turns the checked days ember. */
export function dotClass(state: string, perfect: boolean): string {
	switch (state) {
		case 'checked':
			return perfect ? 'bg-ember' : 'bg-signal';
		case 'rest':
			return 'border-2 border-signal';
		case 'today':
			return 'border-2 border-dashed border-muted-foreground';
		case 'upcoming':
			return 'bg-muted/40';
		default:
			return 'bg-muted';
	}
}

/** The wizard's form, as CheckInForm carries it. */
export type CheckInForm = {
	mood: number;
	energy: number;
	wins: string;
	challenges: string;
	notes: string;
	goalId: string;
	/** 0 when not given. */
	stress: number;
	sleepQuality: number;
	/** The comma-separated text the person typed. */
	tags: string;
};

export function blankForm(): CheckInForm {
	return {
		mood: DEFAULT_SCALE,
		energy: DEFAULT_SCALE,
		wins: '',
		challenges: '',
		notes: '',
		goalId: '',
		stress: 0,
		sleepQuality: 0,
		tags: ''
	};
}

/** FormFor: pre-filled from an existing check-in. */
export function formFor(c: CheckIn | undefined): CheckInForm {
	if (!c) return blankForm();
	return {
		mood: c.mood,
		energy: c.energy,
		wins: c.wins,
		challenges: c.challenges,
		notes: c.notes,
		goalId: c.relatedGoalId ?? '',
		stress: c.stress ?? 0,
		sleepQuality: c.sleepQuality ?? 0,
		tags: c.tags.join(', ')
	};
}

/** Go formFrom: the posted fields, trimmed; unparseable numbers are 0. */
export function formFromData(data: FormData): CheckInForm {
	const text = (k: string) => String(data.get(k) ?? '').trim();
	const int = (k: string) => {
		const raw = String(data.get(k) ?? '').trim();
		return /^[+-]?\d+$/.test(raw) ? Number(raw) : 0;
	};
	return {
		mood: int('mood'),
		energy: int('energy'),
		wins: text('wins'),
		challenges: text('challenges'),
		notes: text('notes'),
		goalId: text('related_goal_id'),
		stress: int('stress'),
		sleepQuality: int('sleep_quality'),
		tags: data.getAll('tags').map(String).join(',')
	};
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** inputFrom: the full form as the API's CheckInRequest, recorded as web. */
export function requestFrom(f: CheckInForm): components['schemas']['CheckInRequest'] {
	return {
		mood: f.mood,
		energy: f.energy,
		wins: f.wins,
		challenges: f.challenges,
		notes: f.notes,
		relatedGoalId: uuidPattern.test(f.goalId) ? f.goalId : undefined,
		stress: f.stress !== 0 ? f.stress : undefined,
		sleepQuality: f.sleepQuality !== 0 ? f.sleepQuality : undefined,
		tags: f.tags.split(','),
		source: 'web'
	};
}

/**
 * The API names fields as JSON does (sleepQuality, relatedGoalId); the form
 * and stepFor use the Go form names.
 */
const formFieldFor: Record<string, string> = {
	sleepQuality: 'sleep_quality',
	relatedGoalId: 'related_goal_id'
};

export function formErrors(fields: Record<string, string>): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(fields)) out[formFieldFor[k] ?? k] = v;
	return out;
}

/** stepFor: the wizard pane that owns each field. */
const stepFor: Record<string, number> = {
	mood: 1,
	energy: 2,
	stress: 2,
	sleep_quality: 2,
	wins: 3,
	challenges: 4,
	notes: 5,
	related_goal_id: 5,
	tags: 5
};

/** FirstErrorStep: the earliest pane with an error, else the first. */
export function firstErrorStep(errors: Record<string, string> | undefined): number {
	let step = 0;
	for (const name of Object.keys(errors ?? {})) {
		const s = stepFor[name];
		if (s === undefined) continue;
		if (step === 0 || s < step) step = s;
	}
	return step === 0 ? 1 : step;
}
