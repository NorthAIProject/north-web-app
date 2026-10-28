// Quick capture (north-client internal/capture/handler.go + web/capture):
// read a sentence, show what it means, write what the person agreed to.
// The pure halves of the Go handler live here so the page's actions and the
// panel agree on field names.

import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';

export type CaptureItem = components['schemas']['CaptureItem'];
export type Outcome = components['schemas']['Outcome'];
export type Draft = { items: CaptureItem[]; unparsed: string[] };
export type Receipt = { written: number; failed: number; outcomes: Outcome[] };

/** What the panel renders: Go's capturepages.Data. */
export type CaptureState = {
	text: string;
	returnTo: string;
	draft?: Draft;
	receipt?: Receipt;
	error?: string;
};

export const MAX_TEXT = 2000;
export const MAX_ITEMS = 25;

/** The pages that embed the panel; anything else is the standalone page (Go embedReturnTo). */
const embeddedPages = new Set(['/app', '/app/nutrition/log']);
export const embedReturnTo = (raw: string | null | undefined) => (raw && embeddedPages.has(raw) ? raw : '');

/** A prefilled sentence from the PWA share target (Go sharedText). */
export function sharedText(q: URLSearchParams): string {
	let text = (q.get('text') ?? '').trim();
	const title = (q.get('title') ?? '').trim();
	if (title && title !== text) text = `${title} ${text}`.trim();
	const link = (q.get('url') ?? '').trim();
	if (link) text = `${text} ${link}`.trim();
	return text.slice(0, MAX_TEXT);
}

/** captured.Writable: a row that can be saved as it stands. */
export function writable(item: CaptureItem): boolean {
	if (item.problem) return false;
	if (item.kind === 'habit') return Boolean(item.habit?.id);
	if (item.kind === 'food') return Boolean(item.food?.ingredient_id);
	return true;
}

/** A kind this build does not name renders as the stored value (Go kindLabel). */
export function kindLabel(i18n: Translator, kind: string): string {
	const key = `capture.kind.${kind}`;
	return i18n.has(key) ? i18n.t(key) : kind;
}

export const foodName = (item: CaptureItem) => item.food?.matched_name || item.food?.query || '';

export function sleepDate(item: CaptureItem): string {
	const d = item.sleep?.date ?? '';
	return d.startsWith('0001-') ? '' : d.slice(0, 10);
}

export function writtenLine(i18n: Translator, r: Receipt): string {
	if (r.failed === 0 && r.written === 1) return i18n.t('capture.logged.one');
	if (r.failed === 0) return i18n.tf('capture.logged.many', r.written);
	return i18n.tf('capture.logged.partial', r.written, r.outcomes.length);
}

/** Go's message(): a whole-request failure the person can act on, or "try again". */
export const tryAgain = 'Something went wrong reading that. Try again.';

class CaptureFormError extends Error {}

const num = (v: FormDataEntryValue | null) => {
	const n = Number(String(v ?? '').trim());
	return Number.isFinite(n) ? n : 0;
};
const int = (v: FormDataEntryValue | null) => Math.trunc(num(v));

/**
 * Rebuilds the reviewed items from the posted preview (Go itemsFromForm). An
 * unticked row is a row the person declined. The server re-validates every
 * value; this only reshapes the form.
 */
export function itemsFromForm(form: FormData): CaptureItem[] {
	const items: CaptureItem[] = [];
	for (let i = 0; i < MAX_ITEMS; i++) {
		const f = (name: string) => form.get(`items[${i}].${name}`);
		const s = (name: string) => String(f(name) ?? '');
		const kind = s('kind').trim() as CaptureItem['kind'];
		if (!kind || !s('include')) continue;
		const item: CaptureItem = { kind, source: s('source') };
		if (s('problem')) item.problem = s('problem');
		switch (kind) {
			case 'water':
				item.water = { amount_ml: int(f('amount_ml')) };
				break;
			case 'sleep': {
				const date = s('date').trim();
				if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new CaptureFormError(`Unreadable date "${date}".`);
				item.sleep = { minutes: int(f('minutes')), quality: int(f('quality')) || undefined, date: date ? `${date}T00:00:00Z` : '0001-01-01T00:00:00Z' };
				break;
			}
			case 'habit':
				item.habit = { name: s('habit_name'), id: s('habit_id').trim() || undefined };
				break;
			case 'weight':
				item.weight = { kg: num(f('kg')) };
				break;
			case 'check_in':
				item.check_in = { mood: int(f('mood')), energy: int(f('energy')), notes: s('notes') || undefined };
				break;
			case 'food':
				item.food = {
					query: s('food'),
					grams: num(f('grams')),
					matched_name: s('matched_name') || undefined,
					ingredient_id: s('ingredient_id').trim() || undefined
				};
				break;
			default:
				throw new CaptureFormError(`Unknown capture kind "${kind}".`);
		}
		items.push(item);
	}
	if (items.length === 0) throw new CaptureFormError('Nothing was ticked, so nothing was logged.');
	return items;
}

export const isCaptureFormError = (err: unknown): err is CaptureFormError => err instanceof CaptureFormError;
