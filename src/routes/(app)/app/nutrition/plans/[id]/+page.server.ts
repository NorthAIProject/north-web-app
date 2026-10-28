import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import type { Api } from '#lib/api/client.js';
import {
	apiWithBody,
	isUuid,
	optionalInt,
	optionalNumber,
	overageOf,
	parseNumber,
	repostFields,
	serverI18n,
	uuidOr
} from '#lib/features/nutrition/server.js';
import type { Overage, Plan } from '#lib/features/nutrition/view.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/meals/handler_plans.go — GET /app/nutrition/plans/{id} and
// every POST that changes a plan. In Go each form posts to its own URL
// (/app/nutrition/days/{dayID}/meals …) and a refused one renders this page;
// here they are named actions on this page carrying their ids as fields, so
// a refusal renders here the same way. Every change lands back on the plan.
export const load: PageServerLoad = async (event) => {
	event.depends('north:nutrition');
	const id = event.params.id;
	if (!isUuid(id)) error(404, (await serverI18n(event)).t('nutrition.err.notfound'));
	const api = serverApi(event);
	const [plan, options, ingredients] = await Promise.all([
		api.GET('/nutrition/plans/{planID}', { params: { path: { planID: id } } }).catch(notFound(event)),
		api.GET('/nutrition/plan-options'),
		api.GET('/nutrition/ingredients', { params: { query: { limit: 200 } } })
	]);
	return {
		plan: plan.data!,
		planTypes: options.data!.planTypes,
		ingredients: ingredients.data!.ingredients,
		// The meal option a change just landed on, whose tab opens first.
		openOption: event.url.searchParams.get('option') ?? ''
	};
};

function notFound(event: RequestEvent) {
	return async (err: unknown): Promise<never> => {
		if (isApiError(err) && err.status === 404) error(404, (await serverI18n(event)).t('nutrition.err.notfound'));
		throw err;
	};
}

/** A refused change as the page shows it (Go: PlanPage.Problem / Overage). */
export type Refusal = {
	problem?: { scope: string; errors: Record<string, string> };
	overage?: Overage & { repost: { action: string; fields: { name: string; value: string }[] } };
};

const planURL = (id: string) => `/app/nutrition/plans/${id}`;
const optionURL = (planId: string, optionId: string) => `${planURL(planId)}?option=${optionId}`;

type Change = (api: Api, form: FormData, planId: string) => Promise<string | void>;

/**
 * Runs a change and lands on the plan (or where the change says). A day
 * taken over its target is a 409 shown as the overage notice, offering to
 * send the same form again confirmed; field errors show beside the form
 * named by scope; anything else is an error page, as Go's h.fail.
 */
function change(action: string, scope: (form: FormData) => string, run: Change) {
	return async (event: RequestEvent) => {
		const form = await event.request.formData();
		const { api, refused } = apiWithBody(event);
		let landing: string | void;
		try {
			landing = await run(api, form, event.params.id!);
		} catch (err) {
			if (err instanceof BadId) error(404, (await serverI18n(event)).t('nutrition.err.notfound'));
			const overage = overageOf(err, refused.body);
			if (overage) {
				return fail(409, {
					overage: { ...overage, repost: { action: `?/${action}`, fields: repostFields(form) } }
				} satisfies Refusal);
			}
			if (isApiError(err) && err.status === 422 && Object.keys(err.fields).length > 0) {
				return fail(422, { problem: { scope: scope(form), errors: err.fields } } satisfies Refusal);
			}
			if (isApiError(err) && err.status < 500) error(err.status, err.message);
			throw err;
		}
		redirect(303, landing || planURL(event.params.id!));
	};
}

const field = (form: FormData, name: string) => String(form.get(name) ?? '');
const confirmed = (form: FormData) => field(form, 'confirm_overage') !== '';

/** A form naming no valid id: a 404, as Go's uuid.Parse of a bad path. */
class BadId extends Error {}

function idOf(form: FormData, name: string): string {
	const id = field(form, name);
	if (!isUuid(id)) throw new BadId(name);
	return id;
}

/** The slot holding meal option id, and its options in order. */
function slotOf(plan: Plan, id: string) {
	for (const d of plan.days) {
		for (const m of d.meals) {
			const options = [m, ...(m.alternatives ?? [])];
			if (options.some((o) => o.id === id)) return options;
		}
	}
	return undefined;
}

export const actions: Actions = {
	delete: async (event) => {
		try {
			await serverApi(event).DELETE('/nutrition/plans/{planID}', { params: { path: { planID: event.params.id } } });
		} catch (err) {
			if (isApiError(err) && err.status < 500) error(err.status, err.message);
			throw err;
		}
		redirect(303, '/app/nutrition/plans');
	},

	settings: change('settings', () => 'settings', async (api, form, planID) => {
		await api.PUT('/nutrition/plans/{planID}', {
			params: { path: { planID } },
			body: {
				name: field(form, 'name'),
				description: field(form, 'description'),
				planType: field(form, 'plan_type') as 'mid_carb',
				mode: field(form, 'mode') as 'easy',
				customCarbPct: optionalNumber(form.get('custom_carb_pct')),
				confirmReset: field(form, 'confirm_reset') !== '',
				confirmOverage: confirmed(form)
			}
		});
	}),

	addDay: change('addDay', () => 'days', async (api, form, planID) => {
		await api.POST('/nutrition/plans/{planID}/days', {
			params: { path: { planID } },
			body: { weekday: optionalInt(form.get('weekday')) }
		});
	}),

	updateDay: change('updateDay', (f) => `day:${field(f, 'day_id')}`, async (api, form) => {
		const carbType = field(form, 'carb_type');
		await api.PUT('/nutrition/plan-days/{dayID}', {
			params: { path: { dayID: idOf(form, 'day_id') } },
			body: {
				carbType: carbType ? (carbType as 'low_carb') : undefined,
				carbG: optionalNumber(form.get('carb_g')),
				proteinG: optionalNumber(form.get('protein_g')),
				fatG: optionalNumber(form.get('fat_g')),
				confirmOverage: confirmed(form)
			}
		});
	}),

	removeDay: change('removeDay', () => 'days', async (api, form) => {
		await api.DELETE('/nutrition/plan-days/{dayID}', { params: { path: { dayID: idOf(form, 'day_id') } } });
	}),

	addMeal: change('addMeal', (f) => `meal:${field(f, 'day_id')}`, async (api, form) => {
		await api.POST('/nutrition/plan-days/{dayID}/meals', {
			params: { path: { dayID: idOf(form, 'day_id') } },
			body: { name: field(form, 'name') }
		});
	}),

	removeMeal: change('removeMeal', () => '', async (api, form) => {
		await api.DELETE('/nutrition/meals/{mealID}', { params: { path: { mealID: idOf(form, 'meal_id') } } });
	}),

	// A blank label is numbered by the service; the page opens on the new option.
	addOption: change('addOption', (f) => `option:${field(f, 'meal_id')}`, async (api, form) => {
		const mealID = idOf(form, 'meal_id');
		const { data } = await api.POST('/nutrition/meals/{mealID}/options', {
			params: { path: { mealID } },
			body: { label: field(form, 'option_label') }
		});
		const options = slotOf(data!, mealID);
		const added = options?.[options.length - 1];
		return added ? optionURL(data!.id, added.id) : undefined;
	}),

	setMealOptional: change('setMealOptional', (f) => `option:${field(f, 'meal_id')}`, async (api, form) => {
		await api.PUT('/nutrition/meals/{mealID}/optional', {
			params: { path: { mealID: idOf(form, 'meal_id') } },
			body: { optional: field(form, 'optional') === 'true', confirmOverage: confirmed(form) }
		});
	}),

	addPortion: change('addPortion', (f) => `portion:${field(f, 'meal_id')}`, async (api, form, planID) => {
		const mealID = idOf(form, 'meal_id');
		await api.POST('/nutrition/meals/{mealID}/ingredients', {
			params: { path: { mealID } },
			body: {
				ingredientId: uuidOr(form.get('ingredient_id')),
				quantityGrams: parseNumber(form.get('quantity_grams')),
				confirmOverage: confirmed(form)
			}
		});
		return optionURL(planID, mealID);
	}),

	// The reviewed lines of a spoken meal: each line posts ingredient_id_N and
	// quantity_grams_N, and every "line" value names an N left ticked.
	addPortions: change('addPortions', (f) => `portion:${field(f, 'meal_id')}`, async (api, form, planID) => {
		const mealID = idOf(form, 'meal_id');
		await api.POST('/nutrition/meals/{mealID}/ingredients/batch', {
			params: { path: { mealID } },
			body: {
				portions: form.getAll('line').map((n) => ({
					ingredientId: uuidOr(form.get(`ingredient_id_${n}`)),
					quantityGrams: parseNumber(form.get(`quantity_grams_${n}`))
				})),
				confirmOverage: confirmed(form)
			}
		});
		return optionURL(planID, mealID);
	}),

	removePortion: change('removePortion', () => '', async (api, form) => {
		await api.DELETE('/nutrition/meal-ingredients/{mealIngredientID}', {
			params: { path: { mealIngredientID: idOf(form, 'portion_id') } }
		});
	}),

	setPortionOptional: change('setPortionOptional', (f) => `portion:${field(f, 'portion_id')}`, async (api, form) => {
		await api.PUT('/nutrition/meal-ingredients/{mealIngredientID}/optional', {
			params: { path: { mealIngredientID: idOf(form, 'portion_id') } },
			body: { optional: field(form, 'optional') === 'true', confirmOverage: confirmed(form) }
		});
	})
};
