import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { TrainingIntake } from '#lib/features/training/types.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/workouts/handler.go showIntake / submitIntake.

const blank: TrainingIntake = {
	goal: '',
	experience: '',
	daysPerWeek: 3,
	sessionMinutes: 45,
	equipment: [],
	limitations: '',
	weekdays: []
};

// Pre-filled from the last intake, so someone regenerating a plan does not
// answer the same questions again.
export const load: PageServerLoad = async (event) => {
	try {
		const { data } = await serverApi(event).GET('/training/intake');
		return { intake: { ...blank, ...data!, weekdays: data!.weekdays ?? [] } };
	} catch (err) {
		if (isApiError(err) && err.status === 404) return { intake: blank };
		throw err;
	}
};

/** Go: atoiOr(…, 0). */
function int(v: FormDataEntryValue | null): number {
	const n = Number.parseInt(String(v ?? '').trim(), 10);
	return Number.isNaN(n) ? 0 : n;
}

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const values: TrainingIntake = {
			goal: String(form.get('goal') ?? '').trim(),
			experience: String(form.get('experience') ?? '').trim(),
			daysPerWeek: int(form.get('days_per_week')),
			sessionMinutes: int(form.get('session_minutes')),
			equipment: form.getAll('equipment').map(String),
			limitations: String(form.get('limitations') ?? '').trim(),
			weekdays: form.getAll('weekdays').map(String)
		};
		// Ticked days are the count: asking for both and refusing a mismatch
		// would only make someone count their own ticks.
		if (values.weekdays && values.weekdays.length > 0) values.daysPerWeek = values.weekdays.length;

		let planID: string;
		try {
			const { data } = await serverApi(event).POST('/training/plans', { body: values });
			planID = data!.id;
		} catch (err) {
			if (!isApiError(err)) throw err;
			if (err.status === 422 && Object.keys(err.fields).length > 0) {
				return fail(422, { values, errors: err.fields, error: '' });
			}
			// The intake was kept, so this is recoverable by trying again rather
			// than by re-entering everything. (Go's words, English there too.)
			const error =
				err.kind === 'unavailable' || err.status === 429
					? 'The coach is busy right now. Your answers were saved — try again in a moment.'
					: 'Khepri could not build a plan that fits those constraints. Try widening them slightly, or try again.';
			return fail(503, { values, errors: {} as Record<string, string>, error });
		}
		redirect(303, `/app/training/${planID}`);
	}
};
