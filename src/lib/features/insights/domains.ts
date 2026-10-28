// API shapes of the domain pages (timeline, body, mind, progress, training,
// nutrition), and the small Go helpers their templates called.

import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';

type Schemas = components['schemas'];

export type TimelineView = Schemas['InsightsTimeline'];
export type BodyView = Schemas['InsightsBody'];
export type MindView = Schemas['InsightsMind'];
export type ProgressView = Schemas['InsightsProgress'];
export type TrainingView = Schemas['InsightsTraining'];
export type LiftingView = Schemas['InsightsLifting'];
export type NutritionView = Schemas['InsightsNutrition'];
export type EatingView = Schemas['InsightsEating'];
export type StatsRow = Schemas['InsightsStatsRow'];
export type StatsBar = Schemas['InsightsStatsBar'];

/** The flat delta the tiles take, from the API's delta. */
export const noDelta = { pct: 0, direction: 0, hasPrior: false };

/** Go formatCount. */
export const formatCount = (n: number) => String(Math.trunc(n));

/** Go formatKgShort / changeLabel: "+2.5 kg", "−1 kg". */
export function changeLabel(i18n: Translator, kg: number): string {
	const sign = kg < 0 ? '−' : '+';
	const v = Math.abs(kg);
	return sign + (Number.isInteger(v) ? `${v.toFixed(0)} kg` : `${i18n.decimal(v, 1)} kg`);
}

/** Go chipHref: the range kept, the kind written only when set. */
export function chipHref(base: string, rangeKey: string, kind: string): string {
	return `${base}?range=${encodeURIComponent(rangeKey)}${kind ? `&kind=${encodeURIComponent(kind)}` : ''}`;
}
