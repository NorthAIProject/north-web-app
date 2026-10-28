import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { splitTimes } from '#lib/features/care/format.js';
import type { CareFormName } from '#lib/features/care/forms.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/care/handler.go (GET /app/care and its water, sleep, habit and
// reminder writes) and internal/medications/handler.go (the medication writes
// under /app/care/medications). Every write is a plain form post here as it
// was there, so the page works with no script; with script the forms are
// enhanced and only the care data is reloaded (the htmx panel swap).
export const load: PageServerLoad = async (event) => {
	event.depends('north:care');
	const api = serverApi(event);
	const [care, meds] = await Promise.all([api.GET('/care'), api.GET('/medications')]);
	return { care: care.data!, medications: meds.data! };
};

type Values = Record<string, string | string[]>;

/**
 * Runs a write; a validation failure goes back to its form with what was
 * typed (Go: respond 422 with Forms{X: form}), anything else bubbles to the
 * error page. Success returns to the page (Go: done → 303 /app/care).
 */
async function write(form: CareFormName | null, values: Values, run: () => Promise<unknown>, rename: Record<string, string> = {}) {
	try {
		await run();
	} catch (err) {
		if (form && isApiError(err) && (err.status === 422 || err.status === 400)) {
			const errors: Record<string, string> = {};
			for (const [field, message] of Object.entries(err.fields)) errors[rename[field] ?? field] = message;
			if (Object.keys(errors).length === 0) errors._ = err.message;
			return fail(422, { form, errors, values });
		}
		throw err;
	}
	redirect(303, '/app/care');
}

async function read(event: RequestEvent) {
	const f = await event.request.formData();
	const str = (name: string) => String(f.get(name) ?? '');
	const days = f
		.getAll('days_of_week')
		.map((d) => Number.parseInt(String(d), 10))
		.filter((d) => Number.isInteger(d));
	return { f, str, days };
}

const intOrZero = (s: string) => {
	const n = Number.parseInt(s, 10);
	return Number.isNaN(n) ? 0 : n;
};

export const actions: Actions = {
	water: async (event) => {
		const { str } = await read(event);
		const amountMl = intOrZero(str('amount_ml'));
		return write('water', {}, () => serverApi(event).POST('/care/water', { body: { amountMl } }));
	},

	undoWater: async (event) => {
		const { str } = await read(event);
		return write(null, {}, () =>
			serverApi(event).DELETE('/care/water/{entryID}', { params: { path: { entryID: str('id') } } })
		);
	},

	sleep: async (event) => {
		const { str } = await read(event);
		const values = {
			hours: str('hours'),
			minutes: str('minutes'),
			quality: str('quality'),
			bedtime: str('bedtime'),
			wake_time: str('wake_time'),
			notes: str('notes')
		};
		const quality = intOrZero(values.quality);
		return write('sleep', values, () =>
			serverApi(event).PUT('/care/sleep', {
				body: {
					durationMinutes: intOrZero(values.hours) * 60 + intOrZero(values.minutes),
					quality: quality > 0 ? quality : undefined,
					bedtime: values.bedtime,
					wakeTime: values.wake_time,
					notes: values.notes
				}
			})
		);
	},

	habit: async (event) => {
		const { str, days } = await read(event);
		const values = { name: str('name'), domain: str('domain'), days_of_week: days.map(String) };
		return write(
			'habit',
			values,
			() => serverApi(event).POST('/care/habits', { body: { name: values.name, domain: values.domain, daysOfWeek: days } }),
			{ daysOfWeek: 'days' }
		);
	},

	// The form sends the state it wants, not a flip, so a double submit is
	// idempotent (Go: doneValue).
	habitDone: async (event) => {
		const { str } = await read(event);
		return write(null, {}, () =>
			serverApi(event).PUT('/care/habits/{habitID}/done', {
				params: { path: { habitID: str('id') } },
				body: { value: str('done') === 'true' }
			})
		);
	},

	habitDelete: async (event) => {
		const { str } = await read(event);
		return write(null, {}, () =>
			serverApi(event).DELETE('/care/habits/{habitID}', { params: { path: { habitID: str('id') } } })
		);
	},

	reminder: async (event) => {
		const { str, days } = await read(event);
		const values = { label: str('label'), time_of_day: str('time_of_day'), days_of_week: days.map(String) };
		return write('reminder', values, () =>
			serverApi(event).POST('/care/reminders', {
				body: { label: values.label, timeOfDay: values.time_of_day, daysOfWeek: days }
			})
		);
	},

	reminderEnabled: async (event) => {
		const { str } = await read(event);
		return write(null, {}, () =>
			serverApi(event).PUT('/care/reminders/{reminderID}/enabled', {
				params: { path: { reminderID: str('id') } },
				body: { value: str('enabled') === 'true' }
			})
		);
	},

	reminderDelete: async (event) => {
		const { str } = await read(event);
		return write(null, {}, () =>
			serverApi(event).DELETE('/care/reminders/{reminderID}', { params: { path: { reminderID: str('id') } } })
		);
	},

	medication: async (event) => {
		const { str } = await read(event);
		const values = { name: str('name'), dose: str('dose'), times: str('times') };
		return write('medication', values, () =>
			serverApi(event).POST('/medications', {
				body: { name: values.name, dose: values.dose, times: splitTimes(values.times), remind: true }
			})
		);
	},

	medicationStop: async (event) => {
		const { str } = await read(event);
		return write(null, {}, () =>
			serverApi(event).POST('/medications/{medicationID}/stop', { params: { path: { medicationID: str('id') } } })
		);
	},

	dose: async (event) => {
		const { str } = await read(event);
		const slot = str('slot');
		return write(null, {}, () =>
			serverApi(event).POST('/medications/{medicationID}/doses', {
				params: { path: { medicationID: str('id') } },
				body: { status: str('status'), slot: slot === '' ? undefined : slot }
			})
		);
	},

	undoDose: async (event) => {
		const { str } = await read(event);
		return write(null, {}, () =>
			serverApi(event).DELETE('/medications/doses/{logID}', { params: { path: { logID: str('id') } } })
		);
	}
};
