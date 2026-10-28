// The body figure's vocabulary and view-model helpers: a port of north-client's
// internal/bodymap (Regions, Fold, RegionOf, Hottest) and the pure functions in
// web/shared/muscleviewer/muscleviewer.templ (heat, details, regionStyle,
// summary). Every colour is decided here; the 3D viewer only paints it.

import type { Translator } from '#lib/i18n/index.js';
import type { BodyMap, MuscleDetail, MuscleViewerProps, RegionHeat } from './types.js';

/** The muscle keys the figure has skin for, in Go's order. */
export const REGIONS = [
	'abs',
	'adductors',
	'biceps',
	'calves',
	'chest',
	'delts',
	'erectors',
	'forearms',
	'glutes',
	'hamstrings',
	'lats',
	'neck',
	'quads',
	'traps',
	'triceps'
] as const;

export type Region = (typeof REGIONS)[number];

/** A muscle key with no skin of its own → the region drawn over it. */
export const FOLD: Record<string, Region> = {
	rhomboids: 'traps',
	serratus: 'abs'
};

const regionSet = new Set<string>(REGIONS);

export function isRegion(key: string): key is Region {
	return regionSet.has(key);
}

/** The region a muscle key shows on, or null for a key the figure does not know. */
export function regionOf(muscle: string): Region | null {
	if (regionSet.has(muscle)) return muscle as Region;
	return FOLD[muscle] ?? null;
}

/** Regions with any heat, hottest first (stable). */
export function hottest(regions: RegionHeat[]): RegionHeat[] {
	return regions
		.map((r, i) => ({ r, i }))
		.filter(({ r }) => r.intensity > 0)
		.sort((a, b) => b.r.intensity - a.r.intensity || a.i - b.i)
		.map(({ r }) => r);
}

// Tier intensities for an exercise's muscles, matching the legend.
export const PRIMARY_HEAT = 1.0;
export const SECONDARY_HEAT = 0.55;
export const STABILIZER_HEAT = 0.25;

/** Every region's colour, 0 to 1, keyed by region. */
export function heatOf(p: MuscleViewerProps): Record<string, number> {
	const out: Record<string, number> = {};
	if (p.map) {
		for (const r of p.map.regions) {
			if (r.intensity > 0) out[r.region] = r.intensity;
		}
		return out;
	}
	const put = (keys: string[] | undefined, value: number) => {
		for (const key of keys ?? []) {
			const region = regionOf(key);
			if (region && value > (out[region] ?? 0)) out[region] = value;
		}
	};
	put(p.primary, PRIMARY_HEAT);
	put(p.secondary, SECONDARY_HEAT);
	put(p.stabilizers, STABILIZER_HEAT);
	return out;
}

function toDate(v: Date | string | null | undefined): Date | null {
	if (!v) return null;
	const d = typeof v === 'string' ? new Date(v) : v;
	if (Number.isNaN(d.getTime()) || d.getTime() <= 0) return null;
	return d;
}

/**
 * What a tap on each region shows, in the reader's language. Day and month
 * are read in UTC when the value is a date-only ISO string ("2026-10-28"),
 * else in the runtime's zone.
 */
export function detailsOf(i18n: Translator, p: MuscleViewerProps): Record<string, MuscleDetail> {
	const out: Record<string, MuscleDetail> = {};
	for (const region of REGIONS) out[region] = { name: i18n.t('muscle.' + region) };
	if (!p.map) return out;
	for (const r of p.map.regions) {
		const d: MuscleDetail = { ...(out[r.region] ?? { name: i18n.t('muscle.' + r.region) }) };
		const last = toDate(r.lastTrained);
		if (!last) {
			d.last = i18n.t('bodymap.never');
		} else {
			const dateOnly = typeof r.lastTrained === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.lastTrained);
			const day = dateOnly ? last.getUTCDate() : last.getDate();
			const month = (dateOnly ? last.getUTCMonth() : last.getMonth()) + 1;
			d.last = i18n.tf('bodymap.last', `${day} ${i18n.t(`month.long.${month}`)}`);
		}
		d.href = '/app/exercises?muscle=' + r.region;
		out[r.region] = d;
	}
	return out;
}

/**
 * One muscle of the flat figure, coloured the way the 3D one is: untrained
 * grey-blue, else a mix from muted ochre toward ember (colourFor in the viewer).
 */
export function regionStyle(h: Record<string, number>, region: string): string {
	const stroke = '; stroke: var(--north-surface); stroke-width: 0.8';
	const v = h[region];
	if (v === undefined || v <= 0) return 'fill: var(--north-body-idle)' + stroke;
	const t = 0.15 + 0.85 * Math.min(v, 1);
	return `fill: color-mix(in oklch, var(--north-ember) ${(t * 100).toFixed(0)}%, var(--north-heat-low))` + stroke;
}

/** The figure in words, for screen readers: the hottest regions. */
export function summaryOf(i18n: Translator, map: BodyMap | null | undefined): string {
	if (!map) return i18n.t('bodymap.figure');
	const hot = hottest(map.regions);
	if (hot.length === 0) return i18n.t('bodymap.empty');
	return i18n.tf('bodymap.summary', hot.map((r) => i18n.t('muscle.' + r.region)).join(', '));
}
