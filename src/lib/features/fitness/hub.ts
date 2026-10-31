// View helpers for the fitness hub (north-client web/fitness/hub_view.go and
// the funcs in web/fitness/fitness.templ). The API sends numbers and dates;
// the wording is built here with the same catalogue keys.

import type { components } from '#lib/api/generated/schema.js';
import { capitalise, formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

export type FitnessHub = components['schemas']['FitnessHub'];
export type StravaStatus = components['schemas']['StravaStatus'];
export type HubSession = FitnessHub['recent'][number];
export type HubWeek = FitnessHub['week'];
export type DayValue = components['schemas']['FitnessDayValue'];
export type PlanDay = components['schemas']['FitnessPlanDay'];

/** A calendar day ("2006-01-02") formatted as that day, whatever the zone. */
export function dayLabel(i18n: Translator, date: string, layout = '2 Jan'): string {
	return formatTime(i18n.locale, `${date}T12:00:00Z`, layout, 'UTC');
}

/** Go fmt "%.0f". */
export function whole(v: number): string {
	return v.toFixed(0);
}

/** 950, 6.5k, 30.9k, 1.2M (Go: compact). */
export function compact(i18n: Translator, v: number): string {
	const a = Math.abs(v);
	if (a >= 1_000_000) return trimZero(i18n.decimal(v / 1_000_000, 1)) + 'M';
	if (a >= 1000) return trimZero(i18n.decimal(v / 1000, 1)) + 'k';
	return whole(v);
}

function trimZero(s: string): string {
	return s.replace(/[.,]0$/, '');
}

export function oneDecimal(i18n: Translator, v: number): string {
	return i18n.decimal(v, 1);
}

/** The tallest bar, so the others are drawn against it. */
function maxMinutes(w: HubWeek): number {
	return w.days.reduce((top, d) => Math.max(top, d.minutes), 0);
}

/** A bar's height as a CSS percentage; any activity is at least a sliver (Go: barHeight). */
export function barHeight(w: HubWeek, minutes: number): string {
	const top = maxMinutes(w);
	if (top <= 0 || minutes <= 0) return '6%';
	return `${Math.max(14, (minutes / top) * 100).toFixed(0)}%`;
}

export function avgMinutesPerDay(w: HubWeek): string {
	if (w.days.length === 0) return '0';
	return whole(w.minutes / w.days.length);
}

/**
 * The weekly strip's day label: English two-letter ("Mo"), other languages
 * their own capitalised short name (Go: barLabel over the "Mon"[:2] labels).
 */
export function barLabel(i18n: Translator, date: string): string {
	if (i18n.locale === 'en') return dayLabel(i18n, date, 'Mon').slice(0, 2);
	return capitalise(dayLabel(i18n, date, 'Mon'));
}

export function sessionsLabel(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('fitness.sessions.one') : i18n.tf('fitness.sessions.n', n);
}

/** How long since a sync, in the one unit that matters (Go: ago). */
export function ago(i18n: Translator, t: string, now: Date): string {
	const ms = now.getTime() - new Date(t).getTime();
	const minutes = ms / 60_000;
	if (minutes < 1) return i18n.t('fitness.ago.now');
	if (minutes < 60) return i18n.tf('fitness.ago.min', Math.trunc(minutes));
	const hours = minutes / 60;
	if (hours < 48) return i18n.tf('fitness.ago.hours', Math.trunc(hours));
	return i18n.tf('fitness.ago.days', Math.trunc(hours / 24));
}

/** Where the week's numbers came from (Go: weekSource). */
export function weekSource(i18n: Translator, hub: FitnessHub, now: Date): string {
	const s = hub.strava;
	if (s.connected && s.lastSyncedAt)
		return i18n.tf('fitness.source.synced', ago(i18n, s.lastSyncedAt, now));
	if (s.connected) return i18n.t('fitness.source.waiting');
	if (hub.week.sessions > 0) return i18n.t('fitness.source.tracked');
	return i18n.t('fitness.source.none');
}

/** The Strava view when there is one to show, the timer's history otherwise. */
export function activitiesHref(hub: FitnessHub): string {
	return hub.strava.connected ? '/app/fitness/activities' : '/app/activity';
}

/** 1h 51m or 48m (Go: shortDuration). */
export function shortDuration(seconds: number): string {
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	return `${Math.trunc(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function pace(r: HubSession): string {
	if (r.distanceKm < 0.1 || r.durationSeconds <= 0) return '';
	const secPerKm = Math.trunc(r.durationSeconds / r.distanceKm);
	return `${Math.trunc(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, '0')}/km`;
}

/** The line under a session's name: only the parts it has (Go: recentDetail). */
export function recentDetail(i18n: Translator, r: HubSession): string {
	const parts = [shortDuration(r.durationSeconds)];
	if (r.distanceKm >= 0.1) parts.push(oneDecimal(i18n, r.distanceKm) + ' km');
	const p = pace(r);
	if (p) parts.push(p);
	if (r.calories > 0) parts.push(`${whole(r.calories)} kcal`);
	return parts.join(' · ');
}

/** "Walking (brisk pace)" reads as Walking (Go: recentTitle). */
export function recentTitle(i18n: Translator, r: HubSession): string {
	const name = r.name.split(' (')[0].replaceAll('_', ' ');
	if (!name) return i18n.t('fitness.recent.session');
	return name[0].toUpperCase() + name.slice(1);
}

export type RecentIcon =
	| 'footprints'
	| 'person-standing'
	| 'bike'
	| 'waves'
	| 'mountain'
	| 'dumbbell'
	| 'heart'
	| 'activity';

/** A glyph from the activity code first, then the category (Go: recentIcon). */
export function recentIcon(r: HubSession): RecentIcon {
	const c = r.activityCode;
	const has = (...xs: string[]) => xs.some((x) => c.includes(x));
	if (has('walk', 'hik')) return 'footprints';
	if (has('run', 'jog')) return 'person-standing';
	if (has('cycl', 'bik')) return 'bike';
	if (has('swim', 'row', 'canoe', 'kayak')) return 'waves';
	if (has('ski', 'climb')) return 'mountain';
	if (r.category === 'strength') return 'dumbbell';
	if (r.category === 'flexibility') return 'heart';
	return 'activity';
}

/** 25 Sep · 17:25 in the reader's zone (Go: when). */
export function when(i18n: Translator, t: string, timeZone: string): string {
	return formatTime(i18n.locale, t, '2 Jan · 15:04', timeZone);
}

/** The newest day with a reading (Go: Trend.latest). */
export function latest(days: DayValue[]): DayValue {
	for (let i = days.length - 1; i >= 0; i--) if (days[i].value > 0) return days[i];
	return { date: days[days.length - 1]?.date ?? '', value: 0 };
}

/** The mean over days that have a reading (Go: Trend.perDay). */
export function perDay(days: DayValue[]): number {
	const withData = days.filter((d) => d.value > 0);
	if (withData.length === 0) return 0;
	return withData.reduce((s, d) => s + d.value, 0) / withData.length;
}

export type TrendRow = { date: string; value: number; delta: number; hasDelta: boolean };

/** The last few days with a reading, newest first, each with its change (Go: recentRows). */
export function recentRows(days: DayValue[], limit: number): TrendRow[] {
	const withData = days.filter((d) => d.value > 0);
	const out: TrendRow[] = [];
	for (let i = withData.length - 1; i >= 0 && out.length < limit; i--) {
		const row: TrendRow = {
			date: withData[i].date,
			value: withData[i].value,
			delta: 0,
			hasDelta: false
		};
		if (i > 0) {
			row.delta = withData[i].value - withData[i - 1].value;
			row.hasDelta = true;
		}
		out.push(row);
	}
	return out;
}

export function signed(i18n: Translator, v: number, prec: number): string {
	const s = i18n.decimal(v, prec);
	return v > 0 ? '+' + s : s;
}

export function deltaClass(v: number): string {
	if (v > 0) return 'text-success';
	if (v < 0) return 'text-destructive';
	return 'text-muted-foreground';
}

/** A coarse reading of a VO2 max estimate, deliberately not age or sex adjusted. */
export function vo2Band(i18n: Translator, v: number): string {
	if (v >= 50) return i18n.t('fitness.vo2.excellent');
	if (v >= 43) return i18n.t('fitness.vo2.good');
	if (v >= 36) return i18n.t('fitness.vo2.fair');
	return i18n.t('fitness.vo2.low');
}

const englishWeekdays = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];

/**
 * A plan day ("Wednesday", as the plan stores it) in the reader's language,
 * lower case as the Romance languages write it (Go: weekdayName).
 */
export function weekdayName(i18n: Translator, english: string): string {
	const n = englishWeekdays.indexOf(english);
	if (n < 0) return english;
	// 7 Jan 2024 is a Sunday.
	return dayLabel(i18n, `2024-01-${String(7 + n).padStart(2, '0')}`, 'Monday');
}

/** "Wednesday completed — Push" (Go: CompletedLineIn). */
export function completedLine(i18n: Translator, d: PlanDay): string {
	const day = weekdayName(i18n, d.weekday);
	return d.focus
		? i18n.tf('fitness.next.donefocus', day, d.focus)
		: i18n.tf('fitness.next.done', day);
}

export function exerciseCount(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('fitness.exercises.one') : i18n.tf('fitness.exercises.n', n);
}

export function trainingHref(hub: FitnessHub): string {
	return hub.planId ? `/app/training/${hub.planId}` : '/app/training';
}

export function percentOf(v: number, of: number): number {
	if (of <= 0) return 0;
	return Math.min(Math.max(Math.trunc((v / of) * 100), 0), 100);
}

/** "80 kg" / "22.5 kg" (Go: kg). */
export function kg(i18n: Translator, v: number): string {
	return Number.isInteger(v) ? `${v.toFixed(0)} kg` : i18n.decimal(v, 1) + ' kg';
}

export function paceLabel(seconds: number): string {
	const s = Math.trunc(seconds + 0.5);
	return `${Math.trunc(s / 60)}:${String(s % 60).padStart(2, '0')} /km`;
}

export function clockLabel(seconds: number): string {
	const s = Math.trunc(seconds + 0.5);
	const pad = (n: number) => String(n).padStart(2, '0');
	if (s >= 3600)
		return `${Math.trunc(s / 3600)}:${pad(Math.trunc((s % 3600) / 60))}:${pad(s % 60)}`;
	return `${Math.trunc(s / 60)}:${pad(s % 60)}`;
}

/** Go: durfmt.HoursMinutes. */
export function hoursMinutes(minutes: number): string {
	return `${Math.trunc(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/**
 * What a Strava action or the OAuth return has to say, keyed by the code the
 * routes redirect with. English, exactly as the Go handler wrote them (they
 * were never in the catalogue). Unknown codes say nothing.
 */
const notices: Record<string, string> = {
	cancelled: 'Strava connection was cancelled.',
	expired: 'That Strava connection expired. Please try again.',
	unverified: 'That Strava connection could not be verified. Please try again.',
	failed: 'Connecting to Strava failed. Please try again.',
	connected: 'Strava connected. Your recent activities are importing now.',
	'sync-first': 'Connect Strava first.',
	'sync-failed': 'Could not start the sync. Please try again.',
	syncing: 'Syncing. New activities will appear shortly.',
	'disconnect-failed': 'Could not disconnect. Please try again.',
	disconnected: 'Strava disconnected. Activities already imported have been kept.'
};

export function noticeText(code: string | null): string {
	return (code && notices[code]) || '';
}
