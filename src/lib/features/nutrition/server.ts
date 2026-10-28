// Server-side helpers for the nutrition form actions.

import type { RequestEvent } from '@sveltejs/kit';
import type { Api } from '#lib/api/client.js';
import { isApiError } from '#lib/api/errors.js';
import { createTranslator, loadMessages, type Translator } from '#lib/i18n/index.js';
import { serverApi } from '#lib/server/api.js';
import type { Overage } from './view.js';

/**
 * serverApi plus the body of the last refused response. ApiError keeps only
 * the usual error envelope; a refused plan change answers 409 with a
 * MacroOverage, and a refused import commit 422 with the previewed draft,
 * which the pages need whole.
 */
export function apiWithBody(event: Pick<RequestEvent, 'fetch' | 'locals'>): { api: Api; refused: { body?: unknown } } {
	const api = serverApi(event);
	const refused: { body?: unknown } = {};
	// onResponse runs last-registered first, so this sees the response before
	// the client's own middleware turns it into an ApiError.
	api.use({
		async onResponse({ response }) {
			if (!response.ok) refused.body = await response.clone().json().catch(() => undefined);
			return undefined;
		}
	});
	return { api, refused };
}

/** The 409 body when a change was refused for going over the target. */
export function overageOf(err: unknown, body: unknown): Overage | undefined {
	if (!isApiError(err) || err.status !== 409) return undefined;
	const b = body as Partial<Overage> | undefined;
	if (!b || !Array.isArray(b.days) || typeof b.canConfirm !== 'boolean') return undefined;
	return b as Overage;
}

/** Go's parseFloat: unparseable or empty is zero. */
export function parseNumber(v: FormDataEntryValue | null): number {
	const s = String(v ?? '').trim();
	if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return 0;
	return Number(s);
}

/** Go's optionalFloat: blank or unreadable is undefined. */
export function optionalNumber(v: FormDataEntryValue | null): number | undefined {
	const s = String(v ?? '').trim();
	if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return undefined;
	return Number(s);
}

/** Go's strconv.Atoi, undefined when it is not a whole number. */
export function optionalInt(v: FormDataEntryValue | null): number | undefined {
	const s = String(v ?? '').trim();
	return /^[+-]?\d+$/.test(s) ? Number(s) : undefined;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

/** A posted id, or the nil UUID (Go: uuid.Parse's zero value), which the service refuses by field. */
export function uuidOr(v: FormDataEntryValue | null): string {
	const s = String(v ?? '').trim();
	return uuidPattern.test(s) ? s : NIL_UUID;
}

export const isUuid = (s: string) => uuidPattern.test(s);

/** Every posted field except confirm_overage, sorted by name, so a refused form can be sent again. */
export function repostFields(form: FormData): { name: string; value: string }[] {
	const out: { name: string; value: string }[] = [];
	for (const [name, value] of form.entries()) {
		if (name === 'confirm_overage' || typeof value !== 'string') continue;
		out.push({ name, value });
	}
	return out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** The request's translator, for the sentences Go's handlers wrote themselves. */
export async function serverI18n(event: Pick<RequestEvent, 'locals'>): Promise<Translator> {
	const { messages, fallback } = await loadMessages(event.locals.locale);
	return createTranslator(event.locals.locale, messages, fallback);
}
