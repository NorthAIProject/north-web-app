// View helpers for the Strava activities page (north-client
// web/fitness/activities_view.go).

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { EChartsOption } from '#lib/components/khepri/echarts.js';
import { trainingTrendOption } from '#lib/features/viz/echarts.js';
import type { Translator } from '#lib/i18n/index.js';
import { dayLabel } from './hub.js';

export type FitnessActivities = components['schemas']['FitnessActivities'];
export type TrainingTrend = components['schemas']['TrainingTrend'];
export type SessionPage = components['schemas']['StravaSessionPage'];
export type StravaSession = SessionPage['sessions'][number];

export type TrendState = 'chart' | 'unconfigured' | 'disconnected' | 'unavailable' | 'empty';

/** Which of the page's five shapes to render (Go: trendState). */
export function trendState(page: FitnessActivities): TrendState {
	const s = page.strava;
	if (!s.configured) return 'unconfigured';
	if (!s.connected) return 'disconnected';
	if (s.unavailable || !page.trend) return 'unavailable';
	if (page.trend.sessions === 0) return 'empty';
	return 'chart';
}

/** 3h 05m, 45m, 2h (Go: humanMinutes). */
export function humanMinutes(minutes: number): string {
	const total = Math.trunc(minutes + 0.5);
	const h = Math.trunc(total / 60);
	const m = total % 60;
	if (h === 0) return `${m}m`;
	if (m === 0) return `${h}h`;
	return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** "A third above" rather than "up 34.2%" (Go: proportion). */
function proportion(i18n: Translator, ratio: number): string {
	const off = Math.abs(ratio - 1);
	if (off >= 0.9) return i18n.t('fitness.trend.double');
	if (off >= 0.6) return i18n.t('fitness.trend.halfagain');
	if (off >= 0.4) return i18n.t('fitness.trend.half');
	if (off >= 0.28) return i18n.t('fitness.trend.third');
	if (off >= 0.2) return i18n.t('fitness.trend.quarter');
	return i18n.t('fitness.trend.little');
}

function comparison(i18n: Translator, t: TrainingTrend): string {
	switch (t.shape) {
		case 'big_week':
			return i18n.tf('fitness.trend.big', proportion(i18n, t.ratio));
		case 'building':
			return i18n.tf('fitness.trend.building', proportion(i18n, t.ratio));
		case 'steady':
			return i18n.t('fitness.trend.steady');
		case 'easier':
			return i18n.tf('fitness.trend.easier', proportion(i18n, t.ratio));
		default:
			return i18n.t('fitness.trend.below');
	}
}

/** What the chart means, in one line (Go: trendSentence). */
export function trendSentence(i18n: Translator, t: TrainingTrend): string {
	if (t.shape === 'no_history') return i18n.t('fitness.trend.nohistory');
	if (t.shape === 'too_new') return i18n.tf('fitness.trend.toonew', humanMinutes(t.recentMinutes));
	return i18n.tf('fitness.trend.sentence', humanMinutes(t.recentMinutes), comparison(i18n, t));
}

/** Only once it is worth saying: one week is not a streak (Go: streakSentence). */
export function streakSentence(i18n: Translator, t: TrainingTrend): string {
	return t.streakWeeks < 2 ? '' : i18n.tf('fitness.trend.streak', t.streakWeeks);
}

/** The --north-sport-* token for a family, written out so each one is greppable. */
export function sportColorVar(family: string): string {
	switch (family) {
		case 'run':
			return 'var(--north-sport-run)';
		case 'ride':
			return 'var(--north-sport-ride)';
		case 'swim':
			return 'var(--north-sport-swim)';
		case 'walk':
			return 'var(--north-sport-walk)';
		case 'strength':
			return 'var(--north-sport-strength)';
		default:
			return 'var(--north-sport-other)';
	}
}

/** The training chart's ECharts option (Go: trendChartOption). */
export function trendChartOption(i18n: Translator, t: TrainingTrend): EChartsOption {
	const labels = t.days.map((d) => dayLabel(i18n, d.date));
	const bands = t.bands.map((b) => ({
		label: i18n.t(`fitness.family.${b.family.toLowerCase()}`),
		color: sportColorVar(b.family),
		values: b.values
	}));
	return trainingTrendOption(labels, bands, i18n.t('fitness.trend.normal'), t.normal);
}

function formatDuration(seconds: number): string {
	const h = Math.trunc(seconds / 3600);
	const m = Math.trunc(seconds / 60) % 60;
	return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

function paceMinPerKm(s: StravaSession): string {
	if (s.distanceM <= 0 || s.movingTimeS <= 0) return '';
	const pace = s.movingTimeS / 60 / (s.distanceM / 1000);
	if (pace <= 0) return '';
	const minutes = Math.trunc(pace);
	const seconds = Math.trunc((pace - minutes) * 60);
	return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
}

/** How far, how long, how fast, how much up (Go: routeSummary). */
export function routeSummary(i18n: Translator, s: StravaSession): string {
	let out = formatDuration(s.movingTimeS);
	if (s.distanceM > 0) {
		out = i18n.decimal(s.distanceM / 1000, 1) + ' km · ' + out;
		const pace = paceMinPerKm(s);
		if (pace) out += ' · ' + pace;
	}
	if (s.elevationM > 0) out += ` · ${s.elevationM.toFixed(0)} m`;
	return out;
}

export function stravaActivityURL(s: StravaSession): string {
	return s.stravaId && s.stravaId > 0 ? `https://www.strava.com/activities/${s.stravaId}` : '';
}

/** "Mon 2 Jan 15:04" in the reader's zone (Go: routeWhen). */
export function routeWhen(i18n: Translator, s: StravaSession, timeZone: string): string {
	return s.startedAt ? formatTime(i18n.locale, s.startedAt, 'Mon 2 Jan 15:04', timeZone) : '';
}

/** The calendar day a session belongs to, in the reader's zone (Go: routeDayKey). */
export function routeDayKey(s: StravaSession, timeZone: string): string {
	return s.startedAt ? formatTime('en', s.startedAt, '2006-01-02', timeZone) : '';
}

export function sessionsPageURL(page: number): string {
	return `/app/fitness/activities?page=${page}`;
}

/** The gap in a page list, as a page number no page can have. */
export const ELLIPSIS = 0;

/** First, last, either side of the current one, and ellipses (Go: sessionPageNumbers). */
export function sessionPageNumbers(p: SessionPage): number[] {
	if (p.totalPages <= 1) return [];
	if (p.totalPages <= 7) return Array.from({ length: p.totalPages }, (_, i) => i + 1);
	const want = new Set([1, p.totalPages]);
	for (let n = p.page - 1; n <= p.page + 1; n++) if (n >= 1 && n <= p.totalPages) want.add(n);
	const out: number[] = [];
	let previous = 0;
	for (let n = 1; n <= p.totalPages; n++) {
		if (!want.has(n)) continue;
		if (previous !== 0 && n !== previous + 1) out.push(ELLIPSIS);
		out.push(n);
		previous = n;
	}
	return out;
}

export function firstOf(p: SessionPage): number {
	return p.sessions.length === 0 ? 0 : (p.page - 1) * p.perPage + 1;
}

export function lastOf(p: SessionPage): number {
	return p.sessions.length === 0 ? 0 : firstOf(p) + p.sessions.length - 1;
}
