// The web set logger's helpers (north-client internal/lifts/handler.go:
// parseSetForm, setRows, loadLabel).

import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';

export type LiftSet = components['schemas']['LiftSet'];
export type LiftSetInput = components['schemas']['LiftSetInput'];

/**
 * The form's values, kept between sets (Go: pages.SetForm). Number inputs
 * bind as numbers (or null when empty), so those fields take either.
 */
type Field = string | number | null | undefined;
export type SetForm = { exercise: string; weightKg: Field; reps: Field; kind: string; rir: Field };

const str = (v: Field) => (v === null || v === undefined ? '' : String(v)).trim();

export const emptyForm = (): SetForm => ({ exercise: '', weightKg: '', reps: '', kind: '', rir: '' });

export const kinds = ['work', 'warmup', 'drop'] as const;

/**
 * Reads the form into an API set, or the catalogue key of a message for the
 * person (Go: parseSetForm). setNumber 0 asks the server to number it and
 * match the name to the catalog, as the Go handler did.
 */
export function parseSetForm(f: SetForm): { input: LiftSetInput } | { error: string } {
	const exerciseName = f.exercise.trim();
	if (!exerciseName) return { error: 'lifts.err.name' };
	let weightKg = 0;
	const w = str(f.weightKg);
	if (w) {
		const normal = w.replaceAll(',', '.');
		if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(normal)) return { error: 'lifts.err.weight' };
		weightKg = Number(normal);
	}
	const r = str(f.reps);
	if (!/^[-+]?\d+$/.test(r)) return { error: 'lifts.err.reps' };
	const input: LiftSetInput = { exerciseName, setNumber: 0, weightKg, reps: Number(r), kind: (f.kind || undefined) as LiftSetInput['kind'] };
	const rir = str(f.rir);
	if (rir) {
		if (!/^[-+]?\d+$/.test(rir)) return { error: 'lifts.err.rir' };
		input.rir = Number(rir);
	}
	return { input };
}

/** Shortest exact decimal in the reader's language: "20", "22,5" (Go: i18n.Decimal(v, -1)). */
export function shortDecimal(i18n: Translator, v: number): string {
	const s = String(v);
	const dot = s.indexOf('.');
	return i18n.decimal(v, dot < 0 ? 0 : s.length - dot - 1);
}

/** "80 kg × 5", or "bodyweight × 12" (Go: loadLabel). */
export function loadLabel(i18n: Translator, s: LiftSet): string {
	if (s.weightKg <= 0) return i18n.tf('lifts.list.bodyweight', s.reps);
	return `${shortDecimal(i18n, s.weightKg)} kg × ${s.reps}`;
}

/** "2 in reserve", "to failure", or "" (Go: setRows). */
export function rirLabel(i18n: Translator, s: LiftSet): string {
	if (s.rir === undefined || s.rir === null) return '';
	return s.rir === 0 ? i18n.t('lifts.list.failure') : i18n.tf('lifts.list.rir', s.rir);
}
