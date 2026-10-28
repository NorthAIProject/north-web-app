import { error, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { isUuid, parseNumber, serverI18n, uuidOr } from '#lib/features/nutrition/server.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/meals/handler_log.go — GET /app/nutrition/log and its three
// POSTs: /log/ingredients (?/ingredient), /log/meals (?/meal) and
// /log/{id}/delete (?/delete, id as a field). Every write lands back here.
export const load: PageServerLoad = async (event) => {
	event.depends('north:nutrition');
	const api = serverApi(event);
	const [log, ingredients, meals] = await Promise.all([
		api.GET('/nutrition/log'),
		api.GET('/nutrition/ingredients', { params: { query: { limit: 200 } } }),
		api.GET('/nutrition/log/meal-options')
	]);
	return { log: log.data!, ingredients: ingredients.data!.ingredients, mealOptions: meals.data!.options };
};

/** Go's h.fail: a refusal is a plain error page with the API's sentence. */
async function write(op: () => Promise<unknown>) {
	try {
		await op();
	} catch (err) {
		if (isApiError(err) && err.status < 500) error(err.status, err.message);
		throw err;
	}
	redirect(303, '/app/nutrition/log');
}

export const actions: Actions = {
	ingredient: async (event) => {
		const form = await event.request.formData();
		const id = String(form.get('ingredient_id') ?? '');
		if (!isUuid(id)) error(422, (await serverI18n(event)).t('nutrition.err.read'));
		await write(() =>
			serverApi(event).POST('/nutrition/log/ingredients', {
				body: { ingredientId: uuidOr(id), quantityGrams: parseNumber(form.get('quantity_grams')) }
			})
		);
	},
	meal: async (event) => {
		const form = await event.request.formData();
		const id = String(form.get('meal_id') ?? '');
		if (!isUuid(id)) error(422, (await serverI18n(event)).t('nutrition.err.read'));
		await write(() => serverApi(event).POST('/nutrition/log/meals', { body: { mealId: id } }));
	},
	delete: async (event) => {
		const id = String((await event.request.formData()).get('id') ?? '');
		if (!isUuid(id)) error(404, (await serverI18n(event)).t('nutrition.err.notfound'));
		await write(() => serverApi(event).DELETE('/nutrition/log/{entryID}', { params: { path: { entryID: id } } }));
	}
};
