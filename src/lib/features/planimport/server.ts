// Server side of the meal plan import pages (north-client
// internal/planimport/handler.go and generate_handler.go), over the JSON API.

import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Api } from '#lib/api/client.js';
import { isApiError } from '#lib/api/errors.js';
import { apiWithBody, overageOf } from '#lib/features/nutrition/server.js';
import type { components } from '#lib/api/generated/schema.js';
import { applyMealAction, mealFromForm, normalize, type MealDraft } from './form.js';

/**
 * A sentence to show: the API's own (already in the reader's language), or a
 * catalogue key with its arguments for the page to translate.
 */
export type Message = { text?: string; key?: string; args?: unknown[] };

/** The review page's data (Go: pages.MealReview). */
export type MealReview = { draft: MealDraft; error?: Message; needsConfirm?: boolean };

/** The upload page's data after a refusal (Go: UploadPage's errMsg). */
export type UploadRefusal = { error: Message };

/**
 * message: only validation, size and quota refusals carry a sentence meant for
 * the person; anything else is a fault on our side, said in general terms.
 */
export function messageOf(err: unknown): Message {
	if (isApiError(err) && err.status < 500 && err.status !== 401 && err.status !== 404) {
		const first = Object.values(err.fields)[0];
		return { text: first || err.message };
	}
	return { key: 'planimport.err.failed' };
}

/** POST /app/nutrition/import: read the uploaded file into a draft. */
export async function parseUpload(event: RequestEvent) {
	const form = await event.request.formData();
	const file = form.get('file');
	if (!(file instanceof File) || file.size === 0 && !file.name) {
		return fail(422, { upload: { error: { key: 'planimport.err.nofile' } } satisfies UploadRefusal });
	}
	const body = new FormData();
	body.set('file', file, file.name);
	try {
		const { api } = apiWithBody(event);
		const { data } = await api.POST('/nutrition/import/parse', {
			body: body as never,
			bodySerializer: (b: unknown) => b as FormData
		});
		return { review: { draft: normalize(data!) } satisfies MealReview };
	} catch (err) {
		if (!isApiError(err)) throw err;
		return fail(err.status || 500, { upload: { error: messageOf(err) } satisfies UploadRefusal });
	}
}

/** previewed asks the API to re-measure a draft; on failure the draft stands as sent. */
async function previewed(api: Api, d: MealDraft): Promise<MealDraft> {
	try {
		const { data } = await api.POST('/nutrition/import/preview', { body: d });
		return normalize(data!);
	} catch {
		return d;
	}
}

/** POST /app/nutrition/import/review: apply the pressed button, then preview or save. */
export async function review(event: RequestEvent) {
	const parsed = mealFromForm(await event.request.formData());
	if (!parsed) {
		return fail(422, { upload: { error: { key: 'planimport.err.expired' } } satisfies UploadRefusal });
	}
	const { draft, action } = parsed;
	applyMealAction(draft, action);
	const { api, refused } = apiWithBody(event);

	if (action.verb === 'save' || action.verb === 'save-confirm') {
		let planId: string;
		try {
			const { data } = await api.POST('/nutrition/import', {
				body: { draft, confirmOverage: action.verb === 'save-confirm' }
			});
			planId = data!.planId;
		} catch (err) {
			if (!isApiError(err)) throw err;
			return fail(err.status || 500, { review: await refusedSave(api, draft, err, refused.body) });
		}
		redirect(303, `/app/nutrition/plans/${planId}`);
	}

	return { review: { draft: await previewed(api, draft) } satisfies MealReview };
}

/** mealView for a refused save: the overage to confirm, or the reason to fix. */
async function refusedSave(api: Api, draft: MealDraft, err: unknown, body: unknown): Promise<MealReview> {
	const over = overageOf(err, body);
	if (over) {
		const d = await previewed(api, draft);
		if (over.canConfirm) return { draft: d, needsConfirm: true };
		return { draft: d, error: { key: 'planimport.err.overeasy', args: [over.message] } };
	}
	const refusal = body as Partial<components['schemas']['MealImportRefusal']> | undefined;
	if (isApiError(err) && err.status === 422 && refusal?.draft) {
		return { draft: normalize(refusal.draft), error: messageOf(err) };
	}
	return { draft: await previewed(api, draft), error: messageOf(err) };
}

/** The generate form as submitted or as last saved (Go: pages.MealGenerateForm). */
export type GenerateForm = {
	objective: string;
	days: number;
	mealsPerDay: number;
	planType: string;
	exclusions: string[];
	notes: string;
	noTarget?: boolean;
	errors?: Record<string, string>;
	error?: Message;
};

/** meals.ParseExclusions: split on , ; and newlines, trim, drop blanks and repeats. */
export function parseExclusions(s: string): string[] {
	const out: string[] = [];
	for (const raw of s.split(/[,;\n]/)) {
		const e = raw.trim();
		if (e && !out.some((seen) => seen.toLowerCase() === e.toLowerCase())) out.push(e);
	}
	return out;
}

const atoi = (s: string) => (/^[+-]?\d+$/.test(s.trim()) ? Number(s.trim()) : 0);

/** POST /app/nutrition/plans/generate: draft the plan and review it as an import. */
export async function generate(event: RequestEvent) {
	const form = await event.request.formData();
	const value = (name: string) => String(form.get(name) ?? '');
	const intake = {
		objective: value('objective').trim(),
		days: atoi(value('days')),
		mealsPerDay: atoi(value('meals_per_day')),
		planType: value('plan_type').trim(),
		exclusions: parseExclusions(value('exclusions')),
		notes: value('notes').trim()
	};
	try {
		const { data } = await serverApiFor(event).POST('/nutrition/plans/generate', { body: intake });
		return { review: { draft: normalize(data!) } satisfies MealReview };
	} catch (err) {
		if (!isApiError(err)) throw err;
		const out: GenerateForm = { ...intake };
		if (Object.keys(err.fields).length > 0) {
			out.errors = err.fields;
			if ('macro_target' in err.fields) out.noTarget = true;
		} else if (err.status === 503) {
			out.error = { key: 'planimport.generate.failed' };
		} else {
			out.error = messageOf(err);
		}
		return fail(err.status || 500, { generate: out });
	}
}

function serverApiFor(event: RequestEvent): Api {
	return apiWithBody(event).api;
}
