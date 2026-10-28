// View helpers for the nutrition pages, ported from north-client
// web/nutrition/plan_view.go and the helpers inside its templ files. Pure:
// they take the translator and API data, never fetch.

import type { components } from '#lib/api/generated/schema.js';
import { sprintf, type Translator } from '#lib/i18n/index.js';

export type Macros = components['schemas']['Macros'];
export type Ingredient = components['schemas']['Ingredient'];
export type Plan = components['schemas']['MealPlanDetail'];
export type PlanSummary = components['schemas']['MealPlanSummary'];
export type PlanDay = components['schemas']['MealPlanDay'];
export type PlanMeal = components['schemas']['MealPlanMeal'];
export type Portion = components['schemas']['MealPortion'];
export type DayStatus = components['schemas']['MealDayStatus'];
export type PlanTypeOption = components['schemas']['MealPlanTypeOption'];
export type Overage = components['schemas']['MacroOverage'];
export type OverageDay = Overage['days'][number];

/**
 * The shared tf, plus Go's half-to-even rounding for "%.0f" arguments (the
 * shared formatter rounds halves up), so both apps show the same numbers.
 */
export function tf(i18n: Translator, key: string, ...args: unknown[]): string {
	const format = i18n.t(key);
	return sprintf(i18n.locale, format, evenHalves(format, args));
}

function evenHalves(format: string, args: unknown[]): unknown[] {
	const out = [...args];
	let next = 0;
	for (const m of format.matchAll(/%(?:\[(\d+)\])?([-+ #0]*\d*(?:\.\d+)?)(?:\[(\d+)\])?([a-z%])/g)) {
		if (m[4] === '%') continue;
		const index = m[1] ?? m[3];
		const at = index ? Number(index) - 1 : next;
		next = at + 1;
		if (m[4] === 'f' && m[2].endsWith('.0') && typeof out[at] === 'number') out[at] = goRound(out[at] as number);
	}
	return out;
}

/** Go's fmt "%.0f" rounding: an exact half goes to the even neighbour. */
export function goRound(v: number): number {
	const floor = Math.floor(v);
	if (v - floor === 0.5) return floor % 2 === 0 ? floor : floor + 1;
	return Math.round(v);
}

/** meal.WeekOrder: Monday first, values as stored (0 is Sunday). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** meal.Categories, in the order the form offers them. */
export const CATEGORIES = ['protein', 'carb', 'fat', 'dairy', 'vegetable', 'fruit', 'beverage', 'snack', 'other'];

const PRESETS = ['no_carb', 'low_carb', 'mid_carb', 'high_carb'];
const isPreset = (t: string) => PRESETS.includes(t);

/** A food category's name; an unknown one reads as Other, as in Go. */
export function categoryLabel(i18n: Translator, c: string | undefined): string {
	if (c && c !== 'other' && CATEGORIES.includes(c)) return i18n.t(`nutrition.category.${c}`);
	return i18n.t('nutrition.category.other');
}

/** meal.PlanType.Label: the English name Go falls back to. */
function goTypeLabel(t: string): string {
	const names: Record<string, string> = {
		no_carb: 'No carb',
		low_carb: 'Low carb',
		mid_carb: 'Mid carb',
		high_carb: 'High carb',
		custom: 'Custom'
	};
	return names[t] ?? t;
}

/** A plan type's name; an unknown type reads as its stored value. */
export function typeLabel(i18n: Translator, t: string): string {
	if (!isPreset(t) && t !== 'custom') return goTypeLabel(t);
	return i18n.t(`nutrition.type.${t}`);
}

/** A day that follows a preset carb level ("Low carb day"). */
export function dayTypeLabel(i18n: Translator, t: string): string {
	if (!isPreset(t)) return goTypeLabel(t);
	return i18n.t(`nutrition.daytype.${t}`);
}

export function planTypeLabel(i18n: Translator, p: { planType: string; customCarbPct?: number }): string {
	if (p.planType === 'custom' && p.customCarbPct != null) return tf(i18n, 'nutrition.type.custom.pct', p.customCarbPct);
	return typeLabel(i18n, p.planType);
}

/** A preset with its carb share and, once there is a target, its default grams. */
export function bandLabel(i18n: Translator, b: PlanTypeOption, target: Macros | undefined): string {
	let label = tf(i18n, 'nutrition.band', typeLabel(i18n, b.id), b.minPct, b.maxPct);
	if (target) label += tf(i18n, 'nutrition.band.grams', b.defaultCarbG ?? (target.carbG * (b.defaultPct ?? 0)) / 100);
	return label;
}

export function targetLine(i18n: Translator, t: Macros): string {
	return tf(i18n, 'nutrition.target.line', t.calories, t.proteinG, t.carbG, t.fatG);
}

export function daysLabel(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('nutrition.days.one') : tf(i18n, 'nutrition.days.many', n);
}

export function modeLabel(i18n: Translator, m: string): string {
	return m === 'advanced' ? i18n.t('nutrition.mode.advanced') : i18n.t('nutrition.mode.easy');
}

export function capitalise(s: string): string {
	return s ? s[0].toLocaleUpperCase() + s.slice(1) : s;
}

/** A weekday mid-sentence: lower case in Spanish and Portuguese. */
export function weekdayInSentence(i18n: Translator, wd: number): string {
	return i18n.t(`weekday.long.${wd}`);
}

/** A weekday as a heading or a button reads it, capitalised. */
export function weekdayName(i18n: Translator, wd: number): string {
	return capitalise(weekdayInSentence(i18n, wd));
}

export function weekdayShort(i18n: Translator, wd: number): string {
	return i18n.t(`weekday.short.${wd}`);
}

/** A day's departure from the plan, empty when it has none. */
export function overrideLabel(i18n: Translator, d: PlanDay): string {
	const parts: string[] = [];
	if (d.carbType != null) parts.push(dayTypeLabel(i18n, d.carbType));
	else if (d.carbG != null) parts.push(tf(i18n, 'nutrition.override.carbs', d.carbG));
	if (d.proteinG != null) parts.push(tf(i18n, 'nutrition.override.protein', d.proteinG));
	if (d.fatG != null) parts.push(tf(i18n, 'nutrition.override.fat', d.fatG));
	return parts.join(' · ');
}

/** One macro of a day's status, for its progress bar (Go: macroRow). */
export type MacroRow = { name: string; key: 'protein' | 'carbs' | 'fat'; consumed: number; target: number; over: number };

export function macroRows(i18n: Translator, s: { consumed: Macros; target: Macros; over: Macros }): MacroRow[] {
	return [
		{ name: i18n.t('nutrition.macro.protein'), key: 'protein', consumed: s.consumed.proteinG, target: s.target.proteinG, over: s.over.proteinG },
		{ name: i18n.t('nutrition.macro.carbs'), key: 'carbs', consumed: s.consumed.carbG, target: s.target.carbG, over: s.over.carbG },
		{ name: i18n.t('nutrition.macro.fat'), key: 'fat', consumed: s.consumed.fatG, target: s.target.fatG, over: s.over.fatG }
	];
}

export const rowInSentence = (i18n: Translator, m: MacroRow) => i18n.t(`nutrition.macro.${m.key}.lower`);

/** How much of the target is used, capped at 100 for the bar. */
export function rowPercent(m: MacroRow): number {
	if (m.target <= 0) return m.consumed > 0 ? 100 : 0;
	return Math.trunc(Math.min(100, (m.consumed / m.target) * 100));
}

export const rowIsOver = (m: MacroRow) => m.over >= 0.5;

export function rowSummary(i18n: Translator, m: MacroRow): string {
	if (rowIsOver(m)) return tf(i18n, 'nutrition.macro.summary.over', m.consumed, m.target, m.over);
	return tf(i18n, 'nutrition.macro.summary.left', m.consumed, m.target, m.target - m.consumed);
}

/** A whole number of grams for the strings that take it as text (Go: grams). */
/** Go's "%.0f". */
export const whole = (v: number) => goRound(v).toFixed(0);
export const grams = whole;

/** One day of an overage notice. */
export function overageLine(i18n: Translator, d: OverageDay): string {
	const parts = macroRows(i18n, d)
		.filter(rowIsOver)
		.map((m) => tf(i18n, 'nutrition.overage.part', rowInSentence(i18n, m), m.over, m.consumed, m.target));
	return `${weekdayName(i18n, d.weekday)}: ${parts.join(', ')}`;
}

/** What a day has left before anything is picked. */
export function remainingLine(i18n: Translator, s: DayStatus): string {
	const parts = macroRows(i18n, s).map((m) =>
		rowIsOver(m)
			? tf(i18n, 'nutrition.macro.over', rowInSentence(i18n, m), grams(m.over))
			: tf(i18n, 'nutrition.macro.left', rowInSentence(i18n, m), grams(m.target - m.consumed))
	);
	return tf(i18n, 'nutrition.remaining', parts.join(' · '));
}

/**
 * What the day would have left after a portion of per100 at amount grams
 * (Go: previewText, an Alpine expression; the same catalogue strings).
 */
export function previewLine(i18n: Translator, s: DayStatus, per100: Macros | undefined, amount: number): string {
	const left = { protein: s.remaining.proteinG, carbs: s.remaining.carbG, fat: s.remaining.fatG };
	const add = { protein: per100?.proteinG ?? 0, carbs: per100?.carbG ?? 0, fat: per100?.fatG ?? 0 };
	const list = (['protein', 'carbs', 'fat'] as const).map((k) => {
		const rest = left[k] - (add[k] * amount) / 100;
		const name = i18n.t(`nutrition.macro.${k}.lower`);
		return rest < -0.5
			? tf(i18n, 'nutrition.macro.over', name, String(Math.round(-rest)))
			: tf(i18n, 'nutrition.macro.left', name, String(Math.round(Math.max(rest, 0))));
	});
	return tf(i18n, 'nutrition.preview.after', list.join(' · '));
}

/** The weekdays a plan does not have yet, Monday first. */
export function freeWeekdays(plan: Plan): number[] {
	return WEEK_ORDER.filter((wd) => !plan.days.some((d) => d.weekday === wd));
}

/** A slot's options, the default first (Go: meal.Meal.Options). */
export type MealOption = { id: string; optionLabel?: string; totalMacros: Macros; ingredients: Portion[] };

export function slotOptions(m: PlanMeal): MealOption[] {
	return [m, ...(m.alternatives ?? [])];
}

/** An option's tab label: its label, or its position. */
export function optionTabLabel(i18n: Translator, o: MealOption, i: number): string {
	return o.optionLabel ? o.optionLabel : tf(i18n, 'nutrition.option.numbered', i + 1);
}

/**
 * The option of a slot whose tab opens first: the one with a refused form,
 * else the one a change just landed on, else the first.
 */
export function openOption(slot: PlanMeal, problemScope: string, landed: string): string {
	let open = slot.id;
	for (const o of slotOptions(slot)) {
		if (problemScope === `portion:${o.id}`) return o.id;
		if (landed === o.id) open = o.id;
	}
	return open;
}

export function removeDayLine(i18n: Translator, meals: number): string {
	return meals === 1 ? i18n.t('nutrition.day.remove.one') : tf(i18n, 'nutrition.day.remove.many', meals);
}

/** A number field's value: blank when unset (Go: gramsValue). */
export const gramsValue = (g: number | undefined | null) => (g == null ? '' : String(g));

/** "%.0f kcal", as the templates print a total. */
export const kcal = (v: number) => `${goRound(v).toFixed(0)} kcal`;
