// The decision form (north-client web/decisions + internal/decisions/handler.go).

import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';

export type Decision = components['schemas']['Decision'];

export type DecisionForm = {
	title: string;
	options: string;
	rationale: string;
	outcome: string;
	held: string;
	errors?: Record<string, string>;
};

/** The answers to "did it hold?"; id names the radio in every language. */
export const heldChoices = [
	{ value: '', id: 'not-yet' },
	{ value: 'yes', id: 'yes' },
	{ value: 'partly', id: 'partly' },
	{ value: 'no', id: 'no' }
] as const;

/** A stored "held" value in the reader's language; an unknown one shows as stored. */
export function heldLabel(i18n: Pick<Translator, 't' | 'has'>, value: string): string {
	if (!value) return i18n.t('decisions.held.none');
	const key = `decisions.held.${value}`;
	return i18n.has(key) ? i18n.t(key) : value;
}

/** Pre-fills the edit form (Go: FormFor). */
export function formFor(d: Decision): DecisionForm {
	return { title: d.title, options: d.options, rationale: d.rationale, outcome: d.outcome, held: d.held ?? '' };
}

/**
 * Reads the posted fields (Go: formFrom). outcome and held are absent from the
 * create form, so they arrive empty there — the right value for a call just made.
 */
export function formFrom(form: FormData): DecisionForm {
	const field = (name: string) => String(form.get(name) ?? '').trim();
	return {
		title: field('title'),
		options: field('options'),
		rationale: field('rationale'),
		outcome: field('outcome'),
		held: field('held')
	};
}

type DecisionInput = components['schemas']['DecisionInput'];

/** The request body for a form. An unknown held value goes through for the API to refuse. */
export function inputFrom(f: DecisionForm): DecisionInput {
	return {
		title: f.title,
		options: f.options,
		rationale: f.rationale,
		outcome: f.outcome,
		held: f.held as DecisionInput['held']
	};
}
