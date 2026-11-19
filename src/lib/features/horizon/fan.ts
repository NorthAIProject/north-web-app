// A lift's fan chart as plain geometry: what was logged as a line up to
// today, then the forecast as a band that widens. Positions are percentages
// of the plot, so the drawing stretches to any width and its labels stay
// ordinary text.

import type { Point } from './view.js';

export type HistoryPoint = { date: string; value: number };

export type Fan = {
	/** The logged line, as SVG path data in a 0–100 square (y grows down). */
	line: string;
	/** The low-to-high band, a closed shape. */
	band: string;
	/** The middle of the band. */
	mid: string;
	/** Where today sits, as a percentage from the left. */
	todayX: number;
	/** Horizontal guides, top to bottom. */
	yTicks: { y: number; value: number }[];
	/** Weeks ahead worth labelling, with where they sit. */
	xTicks: { x: number; weeks: number }[];
	/** Days of history drawn. */
	historyDays: number;
};

const DAY = 86_400_000;

/** How far back the chart looks: as far as the forecast looks ahead, twice. */
const HISTORY_FOR_REACH = 2;

/** Whole days from one calendar date to another; dates are YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
	return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

const round = (v: number) => Math.round(v * 100) / 100;

/** A round step that gives about `count` guides across `span`. */
export function niceStep(span: number, count: number): number {
	if (!(span > 0)) return 1;
	const raw = span / count;
	const power = 10 ** Math.floor(Math.log10(raw));
	const unit = raw / power;
	return (unit >= 5 ? 10 : unit >= 2 ? 5 : unit >= 1 ? 2 : 1) * power;
}

/**
 * The chart for one lift, or null when there is neither a logged day nor a
 * forecast to draw. History is cut to twice the forecast's reach (at least
 * twelve weeks), so the band is never squeezed into a corner by a long past.
 */
export function fan(history: HistoryPoint[], points: Point[], today: string): Fan | null {
	const reach = points.at(-1)?.offsetDays ?? 0;
	const back = Math.max(reach * HISTORY_FOR_REACH, 84);
	const logged = history
		.map((p) => ({ x: Math.min(daysBetween(today, p.date), 0), y: p.value }))
		.filter((p) => p.x >= -back && Number.isFinite(p.y))
		.sort((a, b) => a.x - b.x);
	if (logged.length === 0 && points.length === 0) return null;

	const first = logged[0]?.x ?? 0;
	const left = Math.min(first, 0);
	const right = Math.max(reach, 0);
	const width = right - left || 1;

	const values = [...logged.map((p) => p.y), ...points.flatMap((p) => [p.low, p.high])];
	const lowest = Math.min(...values);
	const highest = Math.max(...values);
	const step = niceStep(highest - lowest || Math.abs(highest) * 0.1 || 1, 4);
	const bottom = Math.floor(lowest / step) * step;
	const top = Math.max(Math.ceil(highest / step) * step, bottom + step);

	const px = (x: number) => round(((x - left) / width) * 100);
	const py = (y: number) => round(100 - ((y - bottom) / (top - bottom)) * 100);
	const path = (pts: { x: number; y: number }[]) =>
		pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x)} ${py(p.y)}`).join(' ');

	const upper = points.map((p) => ({ x: p.offsetDays, y: p.high }));
	const lower = points.map((p) => ({ x: p.offsetDays, y: p.low })).reverse();

	const yTicks: Fan['yTicks'] = [];
	for (let v = top; v >= bottom - step / 2; v -= step) yTicks.push({ y: py(v), value: round(v) });

	const xTicks: Fan['xTicks'] = [];
	for (let weeks = 4; weeks * 7 <= reach; weeks += 4) xTicks.push({ x: px(weeks * 7), weeks });

	return {
		line: path(logged),
		band: points.length > 1 ? `${path(upper)} ${path(lower).replace('M', 'L')} Z` : '',
		mid: points.length > 1 ? path(points.map((p) => ({ x: p.offsetDays, y: p.mid }))) : '',
		todayX: px(0),
		yTicks,
		xTicks,
		historyDays: -left
	};
}
