import { error, fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { isUuid, parseNumber, serverI18n } from '#lib/features/nutrition/server.js';
import { serverApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/meals/handler_ingredients.go — GET /app/nutrition/ingredients,
// POST /app/nutrition/ingredients (?/create) and
// POST /app/nutrition/ingredients/{id}/delete (?/delete, id as a field).
export const load: PageServerLoad = async (event) => {
	event.depends('north:nutrition');
	const query = (event.url.searchParams.get('q') ?? '').trim();
	const { data } = await serverApi(event).GET('/nutrition/ingredients', {
		params: { query: { q: query, limit: 50 } }
	});
	return { query, ingredients: data!.ingredients };
};

export const actions: Actions = {
	create: async (event) => {
		const form = await event.request.formData();
		const value = (name: string) => String(form.get(name) ?? '');
		const values = {
			name: value('name'),
			brand: value('brand'),
			category: value('category'),
			serving_size_grams: value('serving_size_grams'),
			calories_per_100g: value('calories_per_100g'),
			protein_g_per_100g: value('protein_g_per_100g'),
			fat_g_per_100g: value('fat_g_per_100g'),
			carbs_g_per_100g: value('carbs_g_per_100g')
		};
		try {
			await serverApi(event).POST('/nutrition/ingredients', {
				body: {
					name: values.name,
					brand: values.brand,
					category: values.category,
					servingSizeGrams: parseNumber(values.serving_size_grams),
					per100g: {
						calories: parseNumber(values.calories_per_100g),
						proteinG: parseNumber(values.protein_g_per_100g),
						fatG: parseNumber(values.fat_g_per_100g),
						carbG: parseNumber(values.carbs_g_per_100g)
					}
				}
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422 && Object.keys(err.fields).length > 0) {
				return fail(422, { values, errors: err.fields });
			}
			throw err;
		}
		redirect(303, '/app/nutrition/ingredients');
	},

	delete: async (event) => {
		const id = String((await event.request.formData()).get('id') ?? '');
		if (!isUuid(id)) error(404, (await serverI18n(event)).t('nutrition.err.notfound'));
		try {
			await serverApi(event).DELETE('/nutrition/ingredients/{ingredientID}', { params: { path: { ingredientID: id } } });
		} catch (err) {
			if (isApiError(err) && err.status === 404) error(404, err.message);
			throw err;
		}
		redirect(303, '/app/nutrition/ingredients');
	}
};
