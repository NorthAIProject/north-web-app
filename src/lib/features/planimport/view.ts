// View helpers for the meal import pages (north-client web/planimport/meal.templ).

import type { Translator } from '#lib/i18n/index.js';
import { tf } from '#lib/features/nutrition/view.js';
import type { FoodDraft, MealDraftMeal } from './form.js';
import type { Message } from './server.js';

export type Macro = { calories: number; proteinG: number; carbG: number; fatG: number };

/** A Message as the reader sees it. */
export function say(i18n: Translator, m: Message | undefined): string {
	if (!m) return '';
	return m.text ?? tf(i18n, m.key ?? '', ...(m.args ?? []));
}

/** A food field's name: food f of option o of meal m on day d. */
export const foodField = (d: number, m: number, o: number, f: number, name: string) => `d${d}.m${m}.o${o}.f${f}.${name}`;

/** Go's fmt %g for a value typed back into a field. */
export const gramsText = (v: number | undefined | null) => (v == null ? '' : String(v));

export function macroLine(i18n: Translator, m: Macro | undefined): string {
	if (!m) return '—';
	return tf(i18n, 'planimport.macros', m.proteinG, m.carbG, m.fatG);
}

/** Protein, carb and fat letters in the reader's language ("P C F", "P HC G"). */
function macroLetters(i18n: Translator): [string, string, string] {
	const letters: [string, string, string] = ['P', 'C', 'F'];
	i18n
		.t('planimport.macro.letters')
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 3)
		.forEach((l, i) => (letters[i] = l));
	return letters;
}

/** The file's own macros for a line, "20 P · 3 C". */
export function stated(i18n: Translator, f: FoodDraft): string {
	const letters = macroLetters(i18n);
	const parts: string[] = [];
	[f.statedProteinG, f.statedCarbG, f.statedFatG].forEach((v, i) => {
		if (v != null) parts.push(`${v.toFixed(0)} ${letters[i]}`);
	});
	return parts.join(' · ');
}

/** What the file said of the amount: "2 slice", or just the unit. */
export function amount(f: FoodDraft): string {
	if (f.quantity == null) return f.unit;
	return `${f.quantity} ${f.unit}`.trim();
}

export function ingredientValue(f: FoodDraft): string {
	if (f.saveAsMine) return 'mine';
	return f.ingredientId ?? '';
}

export const hasStatedMacros = (f: FoodDraft) => f.statedProteinG != null && f.statedCarbG != null && f.statedFatG != null;

export const candidateListed = (f: FoodDraft) => (f.candidates ?? []).some((c) => c.id === f.ingredientId);

/** Monday first, with the values meal.Meal stores (0 is Sunday). */
export const MEAL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

/** The preset carb bands (meal.CarbBands). */
export const CARB_BANDS = [
	{ type: 'no_carb', label: 'No carb', minPct: 0, maxPct: 5 },
	{ type: 'low_carb', label: 'Low carb', minPct: 6, maxPct: 25 },
	{ type: 'mid_carb', label: 'Mid carb', minPct: 26, maxPct: 45 },
	{ type: 'high_carb', label: 'High carb', minPct: 46, maxPct: 65 }
];

/** A band's name and share, "Mid carb (26–45%)". */
export function bandChoice(i18n: Translator, b: (typeof CARB_BANDS)[number]): string {
	const key = `planimport.band.${b.type}`;
	const name = i18n.has(key) ? i18n.t(key) : b.label;
	return `${name} (${b.minPct.toFixed(0)}–${b.maxPct.toFixed(0)}%)`;
}

/** Option o's name: the file's label, or its number. */
export function optionName(i18n: Translator, m: MealDraftMeal, o: number): string {
	const label = o === 0 ? m.optionLabel : m.alternatives?.[o - 1]?.label;
	return label ? label : tf(i18n, 'nutrition.option.numbered', o + 1);
}

/** A day's heading: the file's label, or "Training day N" (Go: dayLabel). */
export function dayLabel(i18n: Translator, label: string, i: number): string {
	return label ? label : tf(i18n, 'planimport.workout.day', i + 1);
}

export const anyOver = (days: { over?: string[] }[]) => days.some((d) => (d.over ?? []).length > 0);
