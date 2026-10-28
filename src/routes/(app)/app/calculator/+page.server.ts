import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { toMetric, UNITS_METRIC } from '#lib/features/calculator/units.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/calculator/handler.go — GET /app/calculator, POST
// /app/calculator/biometrics and /app/calculator/generate. The two posts are
// named actions here; both land back on /app/calculator, as in Go.

/** The person's units, metric when unset or unreadable (Go: unitsFor). */
async function unitsFor(event: RequestEvent): Promise<string> {
	try {
		const { data } = await serverApi(event).GET('/settings/preferences');
		return data?.unitsSystem || UNITS_METRIC;
	} catch {
		return UNITS_METRIC;
	}
}

export const load: PageServerLoad = async (event) => {
	event.depends('north:calculator');
	const [{ data }, units] = await Promise.all([serverApi(event).GET('/calculator'), unitsFor(event)]);
	return { calculator: data!, units };
};

/** Go's strconv.ParseFloat with the error dropped: unreadable is 0. */
function number(v: FormDataEntryValue | null): number {
	const s = String(v ?? '');
	return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s) ? Number(s) : 0;
}

/** The API names the date field in its own style; the form uses Go's. */
function webFields(fields: Record<string, string>): Record<string, string> {
	const out = { ...fields };
	if (out.dateOfBirth && !out.date_of_birth) out.date_of_birth = out.dateOfBirth;
	delete out.dateOfBirth;
	return out;
}

export const actions: Actions = {
	biometrics: async (event) => {
		const form = await event.request.formData();
		const values = {
			weight: String(form.get('weight') ?? ''),
			height: String(form.get('height') ?? ''),
			date_of_birth: String(form.get('date_of_birth') ?? ''),
			sex: String(form.get('sex') ?? '')
		};
		// Converted here, at the edge: biometrics stores metric only.
		const { kg, cm } = toMetric(number(values.weight), number(values.height), await unitsFor(event));
		try {
			await serverApi(event).PUT('/calculator/biometrics', {
				body: { weightKg: kg, heightCm: cm, dateOfBirth: values.date_of_birth, sex: values.sex }
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { biometrics: { values, errors: webFields(err.fields) } });
			}
			throw err;
		}
		redirect(303, '/app/calculator');
	},

	generate: async (event) => {
		const form = await event.request.formData();
		const values = {
			activity_level: String(form.get('activity_level') ?? ''),
			goal: String(form.get('goal') ?? ''),
			macro_split: String(form.get('macro_split') ?? '')
		};
		try {
			await serverApi(event).POST('/calculator/plan', {
				body: { activityLevel: values.activity_level, goal: values.goal, macroSplit: values.macro_split }
			});
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				// A failure that is not per field (no measurements yet) shows under
				// the form, as Go's "_" error.
				const errors = Object.keys(err.fields).length > 0 ? err.fields : { _: err.message };
				return fail(422, { plan: { values, errors } });
			}
			throw err;
		}
		redirect(303, '/app/calculator');
	}
};
