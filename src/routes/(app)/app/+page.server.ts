import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import type { Api } from '#lib/api/client.js';
import type { Actions, PageServerLoad } from './$types';

// My Day (Go: internal/day/handler.go show). GET /day is the page; the body
// figure's heat, its shape and the progress-check chip come from their own
// endpoints and, as in Go, a chip that cannot load is left out rather than
// failing the page. The rules and the first week's card load alongside.
const optional = async <T>(p: Promise<{ data?: T }>): Promise<T | null> => {
	try {
		return (await p).data ?? null;
	} catch {
		return null;
	}
};

export const load: PageServerLoad = async (event) => {
	event.depends('north:day');
	const client = serverApi(event);
	const date = event.url.searchParams.get('date') ?? undefined;

	const [day, rules, map, current, progress, firstWeek, soreness, sorenessHistory] = await Promise.all([
		client.GET('/day', { params: { query: { date } } }).then((r) => r.data!),
		optional(client.GET('/day/rules')),
		optional(client.GET('/body/map', { params: { query: { days: 7 } } })),
		optional(client.GET('/body/current')),
		optional(client.GET('/progress/checks')),
		optional(client.GET('/first-week')),
		optional(client.GET('/soreness')),
		optional(client.GET('/soreness/history', { params: { query: { days: 14 } } }))
	]);

	return { day, rules, map, morph: current?.morph ?? null, progress, firstWeek, soreness, sorenessHistory };
};

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const int = (form: FormData, key: string) => {
	const n = Number.parseInt(str(form, key), 10);
	return Number.isFinite(n) ? n : 0;
};

/**
 * Runs one quick-add write. Go answered a rejected value with a 422 and the
 * day.log.invalid sentence; a successful one redirected back to My Day,
 * which use:enhance turns into a reload of the page's data.
 */
async function write(run: () => Promise<unknown>, message = 'day.log.invalid') {
	try {
		await run();
	} catch (err) {
		if (isApiError(err) && err.status < 500) return fail(422, { error: message });
		throw err;
	}
	return { ok: true };
}

/** Writes that Go never reported (stopping a fast, ticking a tracker) only log. */
async function quietly(run: () => Promise<unknown>) {
	try {
		await run();
	} catch (err) {
		if (!isApiError(err) || err.status >= 500) throw err;
	}
	return { ok: true };
}

async function api(event: Parameters<Actions[string]>[0]): Promise<[Api, FormData]> {
	return [serverApi(event), await event.request.formData()];
}

export const actions: Actions = {
	// Go: POST /app/care/water (hydration), with return_to=/app.
	water: async (event) => {
		const [a, form] = await api(event);
		return write(() => a.POST('/care/water', { body: { amountMl: int(form, 'amount_ml') } }));
	},

	// Go: POST /app/caffeine — a preset, or mg and an optional label.
	caffeine: async (event) => {
		const [a, form] = await api(event);
		const mg = int(form, 'mg');
		return write(() =>
			a.POST('/caffeine', {
				body: { preset: str(form, 'preset') || undefined, mg: mg || undefined, label: str(form, 'label') || undefined }
			})
		);
	},

	// Go: POST /app/supplements
	supplement: async (event) => {
		const [a, form] = await api(event);
		const count = int(form, 'count');
		return write(() =>
			a.POST('/supplements', {
				body: { preset: str(form, 'preset') || undefined, name: str(form, 'name') || undefined, count: count || undefined }
			})
		);
	},

	// Go: POST /app/screen-time — hours and minutes, recorded as manual.
	screen: async (event) => {
		const [a, form] = await api(event);
		return write(() =>
			a.PUT('/screen-time', { body: { minutes: int(form, 'hours') * 60 + int(form, 'minutes'), source: 'manual' } })
		);
	},

	// Go: POST /app/trackers
	tracker: async (event) => {
		const [a, form] = await api(event);
		const last = str(form, 'last_done_on');
		const interval = int(form, 'interval_months');
		return write(() =>
			a.POST('/trackers', {
				body: {
					name: str(form, 'name'),
					lastDoneOn: /^\d{4}-\d{2}-\d{2}$/.test(last) ? last : undefined,
					intervalMonths: interval > 0 ? interval : undefined
				}
			})
		);
	},

	// Go: POST /app/trackers/{id}/done
	trackerDone: async (event) => {
		const [a, form] = await api(event);
		return quietly(() => a.POST('/trackers/{id}/done', { params: { path: { id: str(form, 'id') } } }));
	},

	// Go: POST /app/fasting/start
	fastStart: async (event) => {
		const [a, form] = await api(event);
		return write(() => a.POST('/fasting/start', { body: { targetHours: int(form, 'target_hours') || undefined } }));
	},

	// Go: POST /app/fasting/stop
	fastStop: async (event) => quietly(() => serverApi(event).POST('/fasting/stop')),

	// Go: POST /app/soreness — severity 0 clears the region.
	soreness: async (event) => {
		const [a, form] = await api(event);
		const region = str(form, 'region');
		const severity = int(form, 'severity');
		const path = { params: { path: { region } } };
		return write(() =>
			severity === 0
				? a.DELETE('/soreness/{region}', path)
				: a.PUT('/soreness/{region}', { ...path, body: { severity, note: str(form, 'note') || undefined } })
		);
	},

	// Go: POST /app/settings/target-weight (settings), swapped into the chips.
	targetWeight: async (event) => {
		const [a, form] = await api(event);
		const raw = str(form, 'target_weight_kg').replace(',', '.');
		const kg = raw === '' ? null : Number(raw);
		return write(() => a.PUT('/settings/target-weight', { body: { targetWeightKg: kg } }));
	},

	// Go: POST /app/blood-pressure (health web handler)
	bloodPressure: async (event) => {
		const [a, form] = await api(event);
		return write(() =>
			a.POST('/health/blood-pressure', { body: { systolic: int(form, 'systolic'), diastolic: int(form, 'diastolic') } })
		);
	},

	// Go: POST /app/day/rules — the whole form at once; a kind left blank is
	// removed rather than stored empty.
	rules: async (event) => {
		const [a, form] = await api(event);
		const kinds = [...form.keys()].filter((k) => k.startsWith('at_')).map((k) => k.slice(3));
		for (const kind of kinds) {
			const at = str(form, `at_${kind}`);
			const path = { params: { path: { kind } } };
			const res = await write(
				() =>
					at === ''
						? a.DELETE('/day/rules/{kind}', path)
						: a.PUT('/day/rules/{kind}', { ...path, body: { at, enabled: str(form, `on_${kind}`) === 'true' } }),
				'day.rules.invalid'
			);
			if ('status' in res) return res;
		}
		const date = str(form, 'date');
		redirect(303, date ? `/app?date=${encodeURIComponent(date)}` : '/app');
	}
};
