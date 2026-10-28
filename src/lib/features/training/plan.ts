// View helpers for the plan page (north-client web/workouts/workouts.templ).

import type { EChartsOption } from '#lib/components/khepri/echarts.js';
import type { ChartJsProps, LiftRecap, Readiness } from '#lib/components/khepri/types.js';
import type { Translator } from '#lib/i18n/index.js';
import type { PlanDetail, PlanExercise, TrainingOverview } from './types.js';

/** What a new exercise starts at (Go: plan.DefaultSets/Reps/RestSeconds). */
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = '8-12';
export const DEFAULT_REST_SECONDS = 90;

/**
 * The sets×reps label. An imported plan can leave either out, and "0×" would
 * read as an instruction to do nothing, so what was not stated is not shown.
 */
export function prescription(i18n: Translator, ex: PlanExercise): string {
	if (ex.sets > 0 && ex.reps !== '') return `${ex.sets}×${ex.reps}`;
	if (ex.sets > 0) return i18n.tf('workouts.ex.nsets', ex.sets);
	if (ex.reps !== '') return i18n.tf('workouts.ex.nreps', ex.reps);
	return i18n.t('workouts.ex.setprescription');
}

/** The load, rest and equipment that are known, joined. */
export function exerciseDetails(i18n: Translator, ex: PlanExercise): string {
	const parts: string[] = [];
	if (ex.load) parts.push(i18n.tf('workouts.ex.load', ex.load));
	if (ex.restSeconds > 0) parts.push(i18n.tf('workouts.ex.restfor', ex.restSeconds));
	if (ex.equipment) parts.push(ex.equipment);
	return parts.join(' · ');
}

/** Whether the plan shows artwork anywhere, and so owes the CC BY-SA credit. */
export function anyIllustrated(p: PlanDetail): boolean {
	return p.days.some((d) => d.exercises.some(hasArt));
}

export function hasArt(ex: PlanExercise): boolean {
	return ex.hasArt && Boolean(ex.illustrationSlug);
}

export function hasMuscles(ex: PlanExercise): boolean {
	return ex.primaryMuscles.length > 0 || ex.secondaryMuscles.length > 0 || (ex.stabilizerMuscles?.length ?? 0) > 0;
}

/** The plan page's URL, which every edit changes (an edit stores a new version). */
export function planURL(id: string): string {
	return `/app/training/${id}`;
}

type WireRecap = NonNullable<TrainingOverview['recap']>;

/** The API's recap in the shape the shared RecapCard reads (Go: lift.Recap). */
export function recapFrom(r: WireRecap): LiftRecap {
	return {
		startedAt: r.startedAt,
		planWeekday: r.planWeekday,
		focus: r.focus,
		sentence: r.sentence,
		durationSeconds: r.durationSeconds,
		setsDone: r.setsDone,
		setsPrescribed: r.setsPrescribed,
		volumeKg: r.volumeKg,
		calories: r.calories,
		exercises: r.exercises.map((e) => ({
			name: e.name,
			sets: e.sets,
			volumeKg: e.volumeKg,
			best: e.best,
			e1rm: e.e1rmKg,
			previousE1rm: e.previousE1rmKg,
			change: e.changeE1rmKg,
			previousVolume: e.previousVolumeKg,
			hasPrevious: e.previousE1rmKg !== undefined
		}))
	};
}

type WireReadiness = NonNullable<TrainingOverview['readiness']>;

export function readinessFrom(r: WireReadiness): Readiness {
	return { ...r, stale: r.stale ?? [] };
}

/**
 * The recap's volume chart. Go draws it with Chart.js (viz.GroupedBar); this
 * app's charts are ECharts, so the same config is redrawn as a grouped bar.
 */
export function groupedBarOption(c: ChartJsProps): EChartsOption {
	const axisLabel = { color: 'var(--muted-foreground)', fontSize: 11 };
	return {
		animation: false,
		grid: { left: 8, right: 8, top: c.showLegend ? 28 : 8, bottom: 8, containLabel: true },
		legend: c.showLegend ? { top: 0, textStyle: { color: 'var(--muted-foreground)' } } : { show: false },
		tooltip: { trigger: 'axis' },
		xAxis: { type: 'category', data: c.data.labels, axisLabel, axisTick: { show: false } },
		yAxis: {
			type: 'value',
			axisLabel,
			splitLine: { show: c.showYGrid ?? true, lineStyle: { color: 'var(--border)' } }
		},
		series: c.data.datasets.map((d) => ({
			name: d.label,
			type: 'bar',
			data: d.data,
			itemStyle: { color: Array.isArray(d.backgroundColor) ? d.backgroundColor[0] : d.backgroundColor }
		}))
	};
}
