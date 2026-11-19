// The forecast as the page draws it. The numbers and every sentence come
// from GET /horizon; this only picks the day being looked at and turns
// ranges into positions on a bar.

import type { components } from '#lib/api/generated/schema.js';
import type { BodyMap } from '#lib/components/khepri/types.js';

export type Horizon = components['schemas']['Horizon'];
export type Series = components['schemas']['HorizonSeries'];
export type Lift = components['schemas']['HorizonLift'];
export type Frame = components['schemas']['HorizonFrame'];
export type Point = components['schemas']['HorizonPoint'];

export type Scenario = { skipWeeks: number; extraSessions: number; deloadNow: boolean };

export const MAX_SKIP_WEEKS = 4;

/** The what-if a URL asks for, kept inside what the server accepts. */
export function scenarioFrom(params: URLSearchParams): Scenario {
	const int = (key: string, max: number) => {
		const n = Number.parseInt(params.get(key) ?? '', 10);
		return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
	};
	return {
		skipWeeks: int('skipWeeks', MAX_SKIP_WEEKS),
		extraSessions: int('extraSessions', 1),
		deloadNow: params.get('deloadNow') === 'true'
	};
}

/** The page's address for a what-if; the plain forecast has no query. */
export function scenarioHref(s: Scenario): string {
	const q = new URLSearchParams();
	if (s.skipWeeks > 0) q.set('skipWeeks', String(s.skipWeeks));
	if (s.extraSessions > 0) q.set('extraSessions', String(s.extraSessions));
	if (s.deloadNow) q.set('deloadNow', 'true');
	const text = q.toString();
	return text ? `/app/horizon?${text}` : '/app/horizon';
}

export function isPlain(s: Scenario): boolean {
	return s.skipWeeks === 0 && s.extraSessions === 0 && !s.deloadNow;
}

/** The range on a day, or null when the series does not reach that far. */
export function pointAt(series: Series, offsetDays: number): Point | null {
	return series.points.find((p) => p.offsetDays === offsetDays) ?? null;
}

/** The furthest day a series is forecast to; 0 when it has no points. */
export function reach(series: Series): number {
	return series.points.at(-1)?.offsetDays ?? 0;
}

export type Bar = {
	/** Left edge and width of the range, in percent of the track. */
	left: number;
	width: number;
	/** Where the middle of the range sits, in percent of the track. */
	mid: number;
	/** Where today's level sits, in percent of the track. */
	now: number;
};

/**
 * Where a day's range sits on a track that spans everything the series is
 * forecast to do, so a bar moves and widens as the day changes instead of
 * always filling its row. Null without a point for the day.
 */
export function barFor(series: Series, offsetDays: number): Bar | null {
	const point = pointAt(series, offsetDays);
	if (!point || series.now === undefined) return null;
	let min = series.now;
	let max = series.now;
	for (const p of series.points) {
		min = Math.min(min, p.low);
		max = Math.max(max, p.high);
	}
	// A flat series still needs a track to sit on.
	const pad = Math.max((max - min) * 0.08, Math.abs(series.now) * 0.005, 0.1);
	min -= pad;
	max += pad;
	const at = (v: number) => ((v - min) / (max - min)) * 100;
	return {
		left: at(point.low),
		// Never thinner than a hairline, or today's zero-width range vanishes.
		width: Math.max(at(point.high) - at(point.low), 0.6),
		mid: at(point.mid),
		now: at(series.now)
	};
}

/** A frame as the body figure reads it: fatigue as heat, per region. */
export function frameMap(frame: Frame | undefined): BodyMap {
	return {
		days: 0,
		regions: (frame?.regions ?? []).map((r) => ({ region: r.id, intensity: r.fatigue }))
	};
}

/** Regions that have lost strength to time away on a frame, most lost first. */
export function detrained(frame: Frame | undefined): { id: string; retained: number }[] {
	return (frame?.regions ?? [])
		.filter((r) => r.retained < 0.995)
		.map((r) => ({ id: r.id, retained: r.retained }))
		.sort((a, b) => a.retained - b.retained);
}

/** Whole weeks ahead, or null for a day that is not on a week boundary. */
export function weeksAhead(offsetDays: number): number | null {
	return offsetDays > 0 && offsetDays % 7 === 0 ? offsetDays / 7 : null;
}
