// View helpers for a finished workout and a plan's week: a port of north-client
// web/shared/workoutsummary/view.go and the lift.Recap sentence it reads.

import type { Translator } from '#lib/i18n/index.js';
import { capitalise, formatTime } from './dates.js';
import { bestLabel } from './workout-card.js';
import type { ChartJsDataset, ChartJsProps, LiftRecap, LiftRecapExercise, RecapView, StaleMuscle, Week, WeekDay } from './types.js';

// Series colours for viz.GroupedBar.
const barSeriesColours = ['var(--north-signal)', 'var(--muted-foreground)', 'var(--north-ember)'];

/** "8,250 kg" / "80 kg" / "72.5 kg" in the reader's language (Go: kg). */
export function kg(i18n: Translator, v: number): string {
	if (v >= 1000) return i18n.thousands(Math.round(v)) + ' kg';
	if (Number.isInteger(v)) return `${v.toFixed(0)} kg`;
	return i18n.decimal(v, 1) + ' kg';
}

/** "+2.5 kg" or "−1 kg" (Go: ChangeLabel). */
export function changeLabel(i18n: Translator, v: number): string {
	let sign = '+';
	if (v < 0) {
		sign = '−';
		v = -v;
	}
	return sign + kg(i18n, v);
}

export function setsLabel(done: number, prescribed: number): string {
	return prescribed > 0 ? `${done} / ${prescribed}` : `${done}`;
}

/** "45 min" / "1h 05m" (Go: minutes). */
export function minutesLabel(seconds: number): string {
	const m = Math.round(seconds / 60);
	if (m < 60) return `${m} min`;
	return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

function hasPrevious(e: LiftRecapExercise): boolean {
	return e.hasPrevious ?? (e.previousE1rm !== undefined && e.previousE1rm > 0);
}

function changeOf(e: LiftRecapExercise): number {
	return e.change ?? (e.e1rm !== undefined && e.previousE1rm !== undefined ? e.e1rm - e.previousE1rm : 0);
}

/** The heaviest set in the reader's language (Go: RecapExercise.BestIn). */
export function recapBestIn(i18n: Translator, e: LiftRecapExercise): string {
	if (!e.bestWeightKg || e.bestWeightKg <= 0) return e.best ?? '';
	return bestLabel(i18n, e.bestWeightKg, e.bestReps ?? 0);
}

/** "1 hour 5 minutes" (Go: lift.formatMinutes). */
function formatMinutes(i18n: Translator, seconds: number): string {
	let mins = Math.round(seconds / 60);
	if (mins < 1) mins = 1;
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	const minutes = m === 1 ? i18n.t('lifts.recap.minute') : i18n.tf('lifts.recap.minutes', m);
	const hours = h === 1 ? i18n.t('lifts.recap.hour') : i18n.tf('lifts.recap.hours', h);
	if (h === 0) return minutes;
	if (m === 0) return hours;
	return i18n.tf('lifts.recap.hours.minutes', hours, minutes);
}

/** The recap in one line in the reader's language (Go: lift.Recap.SentenceIn). */
export function recapSentenceIn(i18n: Translator, r: LiftRecap): string {
	const parts: string[] = [];
	if (r.durationSeconds >= 60) parts.push(formatMinutes(i18n, r.durationSeconds));
	if (r.setsPrescribed > 0 && r.setsDone > 0) parts.push(i18n.tf('lifts.recap.sets.of', r.setsDone, r.setsPrescribed));
	else if (r.setsDone === 1) parts.push(i18n.t('lifts.recap.set'));
	else if (r.setsDone > 0) parts.push(i18n.tf('lifts.recap.sets', r.setsDone));
	if (r.volumeKg > 0) parts.push(i18n.thousands(Math.round(r.volumeKg)) + ' kg');
	let sentence = parts.join(', ');
	if (sentence) sentence += '.';

	let best: LiftRecapExercise | null = null;
	for (const e of r.exercises) {
		if (hasPrevious(e) && (best === null || Math.abs(changeOf(e)) > Math.abs(changeOf(best)))) best = e;
	}
	if (!best || Math.abs(changeOf(best)) < 0.05) return sentence;
	let key = 'lifts.recap.up';
	let delta = changeOf(best);
	if (delta < 0) {
		key = 'lifts.recap.down';
		delta = -delta;
	}
	return (sentence + ' ' + i18n.tf(key, best.name, i18n.decimal(delta, 1))).trim();
}

/** viz.GroupedBar: several named series over shared labels. */
export function groupedBar(id: string, labels: string[], series: { label: string; values: number[] }[]): ChartJsProps {
	const datasets: ChartJsDataset[] = series.map((s, i) => ({
		label: s.label,
		data: s.values,
		borderWidth: 0,
		backgroundColor: barSeriesColours[i % barSeriesColours.length]
	}));
	return {
		id,
		variant: 'bar',
		class: 'min-h-48 w-full',
		data: { labels, datasets },
		showLegend: true,
		showXGrid: false,
		showYGrid: true,
		showXLabels: true,
		showYLabels: true,
		beginAtZero: true
	};
}

/**
 * Shapes a recap for the card (Go: NewRecap + ChartIn). id names the chart
 * and must differ between two cards on one page.
 */
export function newRecap(i18n: Translator, id: string, r: LiftRecap): RecapView {
	const started = r.startedAt ? (typeof r.startedAt === 'string' ? new Date(r.startedAt) : r.startedAt) : null;
	const labels: string[] = [];
	const now: number[] = [];
	const before: number[] = [];
	let withVolume = false;
	const exercises = r.exercises.map((e) => {
		labels.push(e.name);
		now.push(e.volumeKg);
		before.push(e.previousVolume ?? 0);
		withVolume = withVolume || e.volumeKg > 0;
		return {
			name: e.name,
			best: recapBestIn(i18n, e),
			e1rm: e.e1rm && e.e1rm > 0 ? kg(i18n, e.e1rm) : '',
			change: changeOf(e),
			hasChange: hasPrevious(e)
		};
	});
	const hasComparison = r.hasComparison ?? r.exercises.some(hasPrevious);

	let chart: ChartJsProps | null = null;
	if (withVolume) {
		const series = [{ label: i18n.t('layout.recap.series.now'), values: now }];
		if (hasComparison) series.push({ label: i18n.t('layout.recap.series.before'), values: before });
		chart = groupedBar(id, labels, series);
		chart.showLegend = hasComparison;
	}

	return {
		planWeekday: r.planWeekday ?? '',
		focus: r.focus ?? '',
		startedAt: started && !Number.isNaN(started.getTime()) && started.getTime() > 0 ? started : null,
		sentence: r.sentence,
		sentenceLocalised: r.sentence ? recapSentenceIn(i18n, r) : '',
		duration: minutesLabel(r.durationSeconds),
		sets: setsLabel(r.setsDone, r.setsPrescribed),
		volume: kg(i18n, r.volumeKg),
		calories: r.calories > 0 ? `${r.calories.toFixed(0)} kcal` : '—',
		exercises,
		chart
	};
}

const englishWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * An English weekday name ("Monday") in the reader's language, capitalised
 * because it opens a title. Anything else is returned unchanged.
 */
export function weekdayIn(i18n: Translator, english: string): string {
	const wd = englishWeekdays.indexOf(english);
	if (wd < 0) return english;
	// 1 January 2023 was a Sunday, so adding the weekday's index lands on it.
	const date = new Date(Date.UTC(2023, 0, 1 + wd, 12));
	return capitalise(formatTime(i18n.locale, date, 'Monday', 'UTC'));
}

/** The workout's title by plan day and focus (Go: Recap.TitleIn). */
export function recapTitle(i18n: Translator, r: RecapView): string {
	const day = weekdayIn(i18n, r.planWeekday);
	if (day && r.focus) return day + ' · ' + r.focus;
	if (day) return day;
	return i18n.t('layout.recap.last');
}

/** The start time, or "" when unknown (Go: Recap.WhenIn). */
export function recapWhen(i18n: Translator, r: RecapView, timeZone?: string): string {
	if (!r.startedAt) return '';
	return formatTime(i18n.locale, r.startedAt, 'Mon 2 Jan, 15:04', timeZone);
}

/** How much of the week is done, for the bar (Go: Week.Percent). */
export function weekPercent(w: Week): number {
	return w.planned === 0 ? 0 : Math.trunc((w.done * 100) / w.planned);
}

/** Shapes this week's adherence for the strip (Go: NewWeek). Dates are "YYYY-MM-DD" or Date. */
export function newWeek(
	a: { sentence: string; done: number; planned: number; days: { date: Date | string; focus?: string; done: boolean }[] },
	now: Date = new Date()
): Week {
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const days: WeekDay[] = a.days.map((d) => {
		const date =
			typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date)
				? new Date(Number(d.date.slice(0, 4)), Number(d.date.slice(5, 7)) - 1, Number(d.date.slice(8, 10)))
				: new Date(d.date);
		const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
		return { date, focus: d.focus, done: d.done, today: day === today, past: day < today };
	});
	return { sentence: a.sentence, done: a.done, planned: a.planned, days };
}

/** The day's accessible label (Go: weekDayLabel). */
export function weekDayLabel(i18n: Translator, d: WeekDay): string {
	const day = formatTime(i18n.locale, d.date, 'Mon');
	if (d.done) return i18n.tf('layout.week.done', day);
	if (d.today) return i18n.tf('layout.week.today', day);
	if (d.past) return i18n.tf('layout.week.missed', day);
	return i18n.tf('layout.week.upcoming', day);
}

/** A muscle key ("quads") as text ("Quads"). */
export function muscleLabel(key: string): string {
	return key ? key[0].toUpperCase() + key.slice(1) : key;
}

/** "Quads · 25 days, Calves · 18 days" (Go: staleList). */
export function staleList(i18n: Translator, stale: StaleMuscle[]): string {
	return stale.map((m) => i18n.tf('layout.readiness.stale.days', m.name, m.days)).join(', ');
}
