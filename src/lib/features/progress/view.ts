// north-client internal/progresschecks/handler.go (page, pageCheck, formInput,
// applyEstimate, lastPhotos) and web/progress/view.go, over the JSON API.

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

type Schemas = components['schemas'];
export type ApiCheck = Schemas['ProgressCheck'];
export type ApiChecks = Schemas['ProgressChecks'];
export type ApiAssist = Schemas['ProgressAssist'];
export type ApiEstimate = Schemas['ProgressEstimateResult'];

/** Poses in order; required marks the two a complete check needs (Go Poses). */
export const poses = [
	{ name: 'front', required: true },
	{ name: 'side', required: true },
	{ name: 'back', required: false }
] as const;

export const cadences = ['weekly', 'biweekly', 'monthly', ''] as const;

/** progress.Chip */
export type Chip = { key: string; value: string; delta: string; carried: boolean };
/** progress.Photo: URL is the app's /media route, which signs it. */
export type Photo = { pose: string; url: string };
/** progress.Check */
export type Check = { id: string; date: string; chips: Chip[]; photos: Photo[]; assisted: boolean; complete: boolean };

/** progress.Assist */
export type Assist = { available: boolean; label: string; own: boolean };

/** progress.Form: the new-check form's values, kept when a save is refused. */
export type FormValues = {
	measured_on: string;
	weight: string;
	waist: string;
	hips: string;
	chest: string;
	thigh: string;
	arm: string;
	source: string;
	assist_confidence: string;
	assist_notes: string;
};

export const emptyForm = (): FormValues => ({
	measured_on: '',
	weight: '',
	waist: '',
	hips: '',
	chest: '',
	thigh: '',
	arm: '',
	source: '',
	assist_confidence: '',
	assist_notes: ''
});

/** One number field: form name, the service's field-error key, label key, unit. */
export const measurements = [
	{ name: 'weight', field: 'weight_kg', key: 'progress.m.weight', unit: 'kg', api: 'weightKg' },
	{ name: 'waist', field: 'waist_cm', key: 'progress.m.waist', unit: 'cm', api: 'waistCm' },
	{ name: 'hips', field: 'hips_cm', key: 'progress.m.hips', unit: 'cm', api: 'hipsCm' },
	{ name: 'chest', field: 'chest_cm', key: 'progress.m.chest', unit: 'cm', api: 'chestCm' },
	{ name: 'thigh', field: 'thigh_cm', key: 'progress.m.thigh', unit: 'cm', api: 'thighCm' },
	{ name: 'arm', field: 'arm_cm', key: 'progress.m.arm', unit: 'cm', api: 'armCm' }
] as const;

/** progress.EstimateNote */
export type EstimateNote = { confidence: string; notes: string; filled: number; kept: number };

/** A date-only "2006-01-02" in a Go layout, read as the calendar day it names. */
export function dateOnly(locale: string, ymd: string, layout: string): string {
	return formatTime(locale, `${ymd}T12:00:00Z`, layout, 'UTC');
}

/** The reader's local date, YYYY-MM-DD (Go localDate). */
export function localToday(timeZone: string | undefined, now = new Date()): string {
	try {
		return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
	} catch {
		return now.toISOString().slice(0, 10);
	}
}

/** readNumber: one decimal in the reader's mark, a trailing ".0" dropped. */
export function readNumber(i18n: Translator, v: number): string {
	const s = i18n.decimal(v, 1);
	return s.replace(/[.,]0$/, '');
}

/** delta: a change with its sign; no change is not shown. */
export function delta(i18n: Translator, d: number): string {
	d = Math.round(d * 10) / 10;
	if (d > 0) return '+' + readNumber(i18n, d);
	if (d < 0) return '−' + readNumber(i18n, -d);
	return '';
}

/** pageCheck: a check as the history shows it, each number against the one before. */
export function pageCheck(i18n: Translator, c: ApiCheck, older: ApiCheck | undefined): Check {
	const out: Check = {
		id: c.id,
		date: dateOnly(i18n.locale, c.measuredOn, '2 Jan 2006'),
		chips: [],
		photos: c.photos.map((p) => ({ pose: p.pose, url: `/app/media/${p.mediaId}` })),
		assisted: c.source === 'assisted',
		complete: c.complete
	};
	for (const m of measurements) {
		const v = c[m.api];
		if (v == null) continue;
		const chip: Chip = { key: m.key, value: `${readNumber(i18n, v)} ${m.unit}`, delta: '', carried: false };
		if (m.unit === 'kg' && c.weightCarried) {
			chip.carried = true;
		} else if (older) {
			const was = older[m.api];
			if (was != null && (m.unit !== 'kg' || !older.weightCarried)) chip.delta = delta(i18n, v - was);
		}
		out.chips.push(chip);
	}
	return out;
}

/** lastPhotos: per pose, the newest photo any check has. */
export function lastPhotos(checks: Check[]): Photo[] {
	const out: Photo[] = [];
	for (const pose of poses) {
		for (const c of checks) {
			const p = c.photos.find((x) => x.pose === pose.name);
			if (p) {
				out.push(p);
				break;
			}
		}
	}
	return out;
}

/** formErrors: the refusal messages in field order, photos first. */
export function formErrors(errors: Record<string, string>): string[] {
	return ['front', 'side', 'back', 'measured_on', 'weight_kg', 'waist_cm', 'hips_cm', 'chest_cm', 'thigh_cm', 'arm_cm']
		.map((k) => errors[k])
		.filter((m): m is string => !!m);
}

export type CheckInput = {
	measuredOn?: string;
	weightKg?: number;
	waistCm?: number;
	hipsCm?: number;
	chestCm?: number;
	thighCm?: number;
	armCm?: number;
	source?: string;
	assistConfidence?: string;
	assistNotes?: string;
};

/**
 * formInput: a blank field is not measured; anything else must be a number,
 * a comma accepted as the decimal mark. Errors are keyed like the service's.
 */
export function formInput(f: FormValues): { input: CheckInput; errors: Record<string, string> } {
	const input: CheckInput = {};
	const errors: Record<string, string> = {};
	if (f.measured_on) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(f.measured_on) || Number.isNaN(Date.parse(f.measured_on))) {
			errors.measured_on = 'The date is not valid.';
		} else {
			input.measuredOn = f.measured_on;
		}
	}
	for (const m of measurements) {
		const raw = f[m.name].trim().replaceAll(',', '.');
		if (raw === '') continue;
		const v = Number(raw);
		if (!Number.isFinite(v) || !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(raw)) {
			errors[m.field] = 'Enter a number.';
			continue;
		}
		input[m.api] = v;
	}
	if (f.source) input.source = f.source;
	if (f.source === 'assisted') {
		if (f.assist_confidence) input.assistConfidence = f.assist_confidence;
		if (f.assist_notes) input.assistNotes = f.assist_notes;
	}
	return { input, errors };
}

/** number: a measurement as a form field holds it, always a decimal point. */
function fieldNumber(v: number): string {
	return v.toFixed(1).replace(/\.0$/, '');
}

/** applyEstimate: fills the empty fields; a typed number outranks an estimate. */
export function applyEstimate(form: FormValues, est: ApiEstimate['estimate']): { form: FormValues; note: EstimateNote } {
	const next = { ...form };
	const note: EstimateNote = { confidence: est.confidence, notes: est.notes, filled: 0, kept: 0 };
	for (const [name, v] of [
		['waist', est.waistCm],
		['hips', est.hipsCm],
		['chest', est.chestCm]
	] as const) {
		if (v == null) continue;
		if (next[name].trim() === '') {
			next[name] = fieldNumber(v);
			note.filled++;
		} else {
			note.kept++;
		}
	}
	if (note.filled > 0) {
		next.source = 'assisted';
		next.assist_confidence = est.confidence;
		next.assist_notes = est.notes;
	}
	return { form: next, note };
}

/** Values read from a posted form. */
export function readForm(data: FormData): FormValues {
	const get = (k: string) => String(data.get(k) ?? '');
	return {
		measured_on: get('measured_on'),
		weight: get('weight'),
		waist: get('waist'),
		hips: get('hips'),
		chest: get('chest'),
		thigh: get('thigh'),
		arm: get('arm'),
		source: get('source'),
		assist_confidence: get('assist_confidence'),
		assist_notes: get('assist_notes')
	};
}

/** The pose files a form carries (Go formPhotos): non-empty file parts only. */
export function formPhotos(data: FormData): [string, File][] {
	const out: [string, File][] = [];
	for (const p of poses) {
		const f = data.get(p.name);
		if (f instanceof File && f.size > 0) out.push([p.name, f]);
	}
	return out;
}

/** The API's camelCase field keys back to the web form's (measuredOn → measured_on). */
export function webFieldErrors(fields: Record<string, string>): Record<string, string> {
	const map: Record<string, string> = { measuredOn: 'measured_on' };
	return Object.fromEntries(Object.entries(fields).map(([k, v]) => [map[k] ?? k, v]));
}
