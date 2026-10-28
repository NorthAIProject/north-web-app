// View helpers for /app/overview, ported from north-client
// web/app/dashboard_view.go. Same keys, same order, same rules.

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

export type Overview = components['schemas']['OverviewResponse'];
export type Snapshot = components['schemas']['TodaySnapshot'];
export type PlanDay = components['schemas']['OverviewPlanDay'];
export type Delta = components['schemas']['Delta'];
export type TimelineEntry = Snapshot['timeline'][number];

/** timerange.All: the selector's keys, in order. */
export const RANGE_KEYS = ['today', 'yesterday', 'week', 'month', 'quarter', 'year'] as const;

/** The one next step kind the template treats specially (Go NextStepKindPush). */
export const NEXT_STEP_PUSH = 'push';

/** rangeLabel: the catalogue's name for a range, else the key. */
export function rangeLabel(i18n: Translator, key: string): string {
	return i18n.has('range.' + key) ? i18n.t('range.' + key) : key;
}

/** rangeHref keeps the selector a plain link (Go rangeHref). */
export function rangeHref(key: string): string {
	return '/app/overview?range=' + key;
}

export function formatLitres(i18n: Translator, ml: number): string {
	if (ml >= 1000) return i18n.decimal(ml / 1000, 1) + ' L';
	return `${ml} ml`;
}

export function formatSleep(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatPct(pct: number): string {
	return `${Math.abs(pct).toFixed(0)}%`;
}

/** relativeTime keeps a feed row short; past a week it is a date. */
export function relativeTime(i18n: Translator, at: string, now: Date, timezone?: string): string {
	const d = now.getTime() - new Date(at).getTime();
	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;
	if (d < minute) return i18n.t('dash.feed.now');
	if (d < hour) return i18n.tf('dash.feed.minutes', Math.floor(d / minute));
	if (d < day) return i18n.tf('dash.feed.hours', Math.floor(d / hour));
	if (d < 7 * day) return i18n.tf('dash.feed.days', Math.floor(d / day));
	return formatTime(i18n.locale, at, '2 Jan', timezone);
}

export function streakKPI(i18n: Translator, streak: number): string {
	if (streak <= 0) return '—';
	if (streak === 1) return i18n.t('dash.kpi.streak.one');
	return i18n.tf('dash.kpi.streak.many', streak);
}

export function goalActivityLabel(i18n: Translator, n: number): string {
	if (n <= 0) return '';
	if (n === 1) return i18n.t('dash.goals.week.one');
	return i18n.tf('dash.goals.week.many', n);
}

export function waterKPI(i18n: Translator, s: Snapshot): string {
	const h = s.hydration;
	if (h.targetML <= 0 && h.todayML <= 0) return '—';
	return `${formatLitres(i18n, h.todayML)} / ${formatLitres(i18n, h.targetML)}`;
}

export function sleepKPI(s: Snapshot): string {
	if (!s.sleep.logged) return '—';
	let text = formatSleep(s.sleep.durationMinutes);
	if (s.sleep.quality != null) text += ` · ${s.sleep.quality}/5`;
	return text;
}

export function caloriesKPI(s: Snapshot): string {
	if (s.activityCalories <= 0) return '—';
	return `${s.activityCalories.toFixed(0)} kcal`;
}

export function hydrationHasData(o: Overview): boolean {
	return o.snapshot.hydration.todayML > 0 || o.hydrationDays.some((d) => d.totalML > 0);
}

export function checkInsHaveData(o: Overview): boolean {
	return o.checkIns.some((d) => d.mood > 0 || d.energy > 0);
}

/** A goal's progress percent, or null without milestones or a progress value. */
export function goalProgress(g: Snapshot['goals'][number]): number | null {
	return g.progress ?? null;
}

/** conversations.DisplayTitle. */
export function threadTitle(t: NonNullable<Snapshot['lastThread']>): string {
	const title = t.title.trim();
	if (title) return title;
	return t.kind === 'reflection' ? 'Reflection' : 'New conversation';
}

/** The weekday's name in the reader's language (fitness weekdayName). */
export function weekdayName(locale: string, english: string): string {
	const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const n = names.indexOf(english);
	if (n < 0) return english;
	// 2023-01-01 was a Sunday; noon UTC keeps every zone on the same date.
	const date = new Date(Date.UTC(2023, 0, 1 + n, 12));
	return formatTime(locale, date, 'Monday', 'UTC');
}

/** fitness.CompletedLineIn. */
export function completedLine(i18n: Translator, d: PlanDay): string {
	const day = weekdayName(i18n.locale, d.weekday);
	if (!d.focus) return i18n.tf('fitness.next.done', day);
	return i18n.tf('fitness.next.donefocus', day, d.focus);
}

/** TodayItem: one thing the reader can still do today. */
export type TodayItem = {
	key: 'checkin' | 'train' | 'water' | 'sleep';
	icon: 'smile' | 'dumbbell' | 'droplet' | 'moon';
	label: string;
	detail: string;
	href: string;
	cta: string;
	done: boolean;
};

/** todayItems: check-in and sleep always; training on a plan day; water once there is a target. */
export function todayItems(i18n: Translator, o: Overview, timezone?: string): TodayItem[] {
	const s = o.snapshot;
	const items: TodayItem[] = [checkInItem(i18n, s, timezone)];
	if (o.doneToday) items.push(trainItem(i18n, o, o.doneToday, true));
	else if (o.sessionToday && o.nextSession) items.push(trainItem(i18n, o, o.nextSession, false));
	if (s.hydration.targetML > 0) {
		items.push({
			key: 'water',
			icon: 'droplet',
			label: i18n.t('dash.today.water'),
			detail: waterKPI(i18n, s),
			href: '/app/care',
			cta: i18n.t('dash.kpi.logwater'),
			done: s.hydration.todayML >= s.hydration.targetML
		});
	}
	items.push({
		key: 'sleep',
		icon: 'moon',
		label: i18n.t('dash.today.sleep'),
		detail: s.sleep.logged ? sleepKPI(s) : i18n.t('dash.today.sleep.none'),
		href: '/app/care',
		cta: i18n.t('dash.kpi.logsleep'),
		done: s.sleep.logged
	});
	return items;
}

function checkInItem(i18n: Translator, s: Snapshot, timezone?: string): TodayItem {
	let detail = i18n.t('dash.today.checkin.detail');
	if (s.todayCheckIn) {
		const c = s.todayCheckIn;
		detail = i18n.tf('dash.today.checkin.done', c.mood, c.energy, formatTime(i18n.locale, c.at, '15:04', timezone));
	} else if (s.streak > 0) {
		detail = i18n.tf('dash.today.streak', streakKPI(i18n, s.streak));
	}
	return {
		key: 'checkin',
		icon: 'smile',
		label: i18n.t('dash.today.checkin'),
		detail,
		href: '/app/check-ins',
		cta: i18n.t('dash.kpi.checkcta'),
		done: s.checkedInToday
	};
}

function trainItem(i18n: Translator, o: Overview, day: PlanDay, done: boolean): TodayItem {
	const focus = day.focus || day.weekday;
	let detail = i18n.tf('dash.today.train.count', day.exerciseCount);
	if (day.startTime) detail = `${day.startTime} · ${detail}`;
	return {
		key: 'train',
		icon: 'dumbbell',
		label: i18n.tf('dash.today.train', focus),
		detail,
		href: '/app/training/' + (o.planId ?? ''),
		cta: i18n.t('dash.training.session'),
		done
	};
}

/** showToday: the Today card hides behind a first-run card, except the push one. */
export function showToday(s: Snapshot): boolean {
	return !s.nextStep || s.nextStep.kind === NEXT_STEP_PUSH;
}

export function habitsDescription(i18n: Translator, o: Overview): string {
	return i18n.t(o.habits.hasHabits ? 'dash.habits.desc' : 'dash.habits.empty');
}

export function hydrationDescription(i18n: Translator, o: Overview): string {
	return i18n.t(hydrationHasData(o) ? 'dash.hydration.desc' : 'dash.hydration.empty');
}
