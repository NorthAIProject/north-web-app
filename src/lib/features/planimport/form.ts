// The meal review form (north-client internal/planimport/form.go).
//
// The review page posts the whole draft back on every button press. The draft
// travels as JSON in one hidden field, and the fields a person can edit are
// posted on top of it, named by position: "d0.m1.o2.f0.grams" is the first
// food of the third option of the second meal of the first day (o0 is a
// meal's first option, oN its Nth alternative). Nothing in either is trusted:
// the API re-validates every value and recomputes every number.

import type { components } from '#lib/api/generated/schema.js';

export type MealDraft = components['schemas']['MealImportDraft'];
export type MealDay = components['schemas']['MealImportDay'];
export type MealDraftMeal = components['schemas']['MealImportMeal'];
export type MealDraftOption = components['schemas']['MealImportOption'];
export type FoodDraft = components['schemas']['MealImportFood'];

/** What the pressed button asked for. */
export type ReviewAction = { verb: string; path: number[] };

/** parseAction: "delete-food:0:1:0:2" → verb and path; anything malformed is an update. */
export function parseAction(raw: string): ReviewAction {
	const parts = raw.split(':');
	const action: ReviewAction = { verb: parts[0] || 'update', path: [] };
	for (const p of parts.slice(1)) {
		if (!/^\d+$/.test(p)) return { verb: 'update', path: [] };
		action.path.push(Number(p));
	}
	return action;
}

/** MealDraft.Normalize: nil slices become empty ones. */
export function normalize(d: MealDraft): MealDraft {
	d.days ??= [];
	d.unparsed ??= [];
	for (const day of d.days) {
		day.meals ??= [];
		day.over ??= [];
		for (const m of day.meals) {
			m.foods = normalizeFoods(m.foods);
			for (const o of m.alternatives ?? []) o.foods = normalizeFoods(o.foods);
		}
	}
	return d;
}

function normalizeFoods(foods: FoodDraft[] | undefined | null): FoodDraft[] {
	const out = foods ?? [];
	for (const f of out) {
		f.candidates ??= [];
		f.flags ??= [];
		f.checks ??= [];
	}
	return out;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const floatPattern = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/** mealFromForm: the draft as reviewed, or undefined when it arrived without its plan. */
export function mealFromForm(form: FormData): { draft: MealDraft; action: ReviewAction } | undefined {
	let d: MealDraft;
	try {
		const raw = String(form.get('draft') ?? '');
		if (!raw) return undefined;
		d = JSON.parse(raw) as MealDraft;
		if (!d || typeof d !== 'object') return undefined;
	} catch {
		return undefined;
	}
	normalize(d);
	const value = (name: string) => String(form.get(name) ?? '');

	d.name = value('name');
	d.planType = value('plan_type');
	d.mode = value('mode');
	delete d.customCarbPct;
	const pct = value('custom_carb_pct').trim();
	if (pct && floatPattern.test(pct)) d.customCarbPct = Number(pct);

	d.days.forEach((day, i) => {
		delete day.weekday;
		const wd = value(`d${i}.weekday`);
		if (/^[+-]?\d+$/.test(wd) && Number(wd) >= 0 && Number(wd) <= 6) day.weekday = Number(wd);
		day.meals.forEach((m, j) => {
			m.name = value(`d${i}.m${j}.name`);
			foodsFromForm(form, `d${i}.m${j}.o0`, m.foods);
			(m.alternatives ?? []).forEach((o, k) => foodsFromForm(form, `d${i}.m${j}.o${k + 1}`, o.foods));
		});
	});
	return { draft: d, action: parseAction(value('action')) };
}

/** foodsFromForm: one option's food lines, posted under prefix. */
function foodsFromForm(form: FormData, prefix: string, foods: FoodDraft[]) {
	foods.forEach((f, k) => {
		const key = (field: string) => String(form.get(`${prefix}.f${k}.${field}`) ?? '');
		delete f.grams;
		const g = key('grams').trim();
		if (floatPattern.test(g) && Number(g) > 0) f.grams = Number(g);

		const choice = key('ingredient');
		if (choice === 'mine') {
			delete f.ingredientId;
			f.saveAsMine = true;
		} else if (choice === '') {
			delete f.ingredientId;
			f.saveAsMine = false;
		} else if (uuidPattern.test(choice)) {
			f.ingredientId = choice;
			f.saveAsMine = false;
		}
	});
}

/** applyMealAction: removes what a delete button named, or toggles a meal optional. */
export function applyMealAction(d: MealDraft, a: ReviewAction) {
	const p = a.path;
	const meal = () => d.days[p[0]].meals[p[1]];
	const hasMeal = () => p[0] < d.days.length && p[1] < d.days[p[0]].meals.length;
	if (a.verb === 'delete-day' && p.length === 1 && p[0] < d.days.length) {
		d.days.splice(p[0], 1);
	} else if (a.verb === 'toggle-meal-optional' && p.length === 2 && hasMeal()) {
		const m = meal();
		if (m.optional) delete m.optional;
		else m.optional = true;
	} else if (a.verb === 'delete-meal' && p.length === 2 && hasMeal()) {
		d.days[p[0]].meals.splice(p[1], 1);
	} else if (a.verb === 'delete-option' && p.length === 3 && hasMeal()) {
		deleteOption(meal(), p[2]);
	} else if (a.verb === 'delete-food' && p.length === 4 && hasMeal()) {
		const m = meal();
		const foods = optionFoods(m, p[2]);
		if (foods && p[3] < foods.length) {
			foods.splice(p[3], 1);
			if (foods.length === 0) deleteOption(m, p[2]);
		}
	}
	dropEmpty(d);
}

/** dropEmpty: meals left with no option, and days left with no meal, go. */
function dropEmpty(d: MealDraft) {
	for (const day of d.days) {
		day.meals = day.meals.filter((m) => m.foods.length > 0 || (m.alternatives ?? []).length > 0);
	}
	d.days = d.days.filter((day) => day.meals.length > 0);
}

/** Option o's foods (0 being the first option), or undefined. */
function optionFoods(m: MealDraftMeal, o: number): FoodDraft[] | undefined {
	if (o === 0) return m.foods;
	const alts = m.alternatives ?? [];
	return o <= alts.length ? alts[o - 1].foods : undefined;
}

/**
 * deleteOption: removing the first promotes the next to be the one counted;
 * removing the only one empties the meal, which dropEmpty then removes.
 */
function deleteOption(m: MealDraftMeal, o: number) {
	const alts = m.alternatives ?? [];
	if (o === 0 && alts.length > 0) {
		const [next, ...rest] = alts;
		m.optionLabel = next.label;
		m.foods = next.foods;
		m.alternatives = rest;
	} else if (o === 0) {
		m.optionLabel = '';
		m.foods = [];
	} else if (o <= alts.length) {
		alts.splice(o - 1, 1);
		m.alternatives = alts;
	}
	if (!m.optionLabel) delete m.optionLabel;
	if ((m.alternatives ?? []).length === 0) delete m.alternatives;
}

/** A meal's options in order, the first one first (draft.MealDraftMeal.Options). */
export function options(m: MealDraftMeal): MealDraftOption[] {
	return [{ label: m.optionLabel ?? '', foods: m.foods }, ...(m.alternatives ?? [])];
}
