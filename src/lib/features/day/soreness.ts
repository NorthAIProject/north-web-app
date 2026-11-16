// Reported soreness on the body figure: which figure regions a day's sore
// zones colour, which zone a tapped muscle logs, and the strip of recent days.
// The zone → figure map comes from the server (GET /soreness `figure`), so the
// web keeps no copy of it.

/** Soreness zone → the figure regions it covers; knees and feet cover none. */
export type ZoneFigure = Record<string, string[]>;

export type SoreDay = {
	/** YYYY-MM-DD */
	date: string;
	/** The day's worst severity, 0 when nothing was reported. */
	severity: number;
	zones: { region: string; severity: number }[];
};

export type SoreFigure = {
	/** Figure region → 0..1, for the viewer's soreness ramp. */
	heat: Record<string, number>;
	/** Figure region → the zone a tap on it logs. */
	zoneOf: Record<string, string>;
	/** Oldest first; empty when the history could not be read. */
	strip: SoreDay[];
};

/**
 * Where each severity sits on the figure's ramp, 1 stiff to 3 painful. Spread
 * wider than severity/3: the ramp starts a little way up, so an even split
 * leaves stiff and painful both reading red.
 */
const SEVERITY_HEAT: Record<number, number> = { 1: 0.05, 2: 0.5, 3: 1 };

/** Each figure region's heat: the worst severity of the zones over it. */
export function soreHeat(entries: { region: string; severity: number }[], figure: ZoneFigure): Record<string, number> {
	const out: Record<string, number> = {};
	for (const e of entries) {
		const value = SEVERITY_HEAT[e.severity] ?? (e.severity > 3 ? 1 : 0);
		for (const region of figure[e.region] ?? []) {
			if (value > (out[region] ?? 0)) out[region] = value;
		}
	}
	return out;
}

/**
 * The zone a tap on each figure region logs. A region two zones cover (the
 * traps: shoulders and upper back) goes to the zone that lists it first.
 */
export function zoneByRegion(figure: ZoneFigure): Record<string, string> {
	const out: Record<string, string> = {};
	const zones = Object.keys(figure).sort();
	for (const zone of zones) {
		const first = figure[zone][0];
		if (first && !(first in out)) out[first] = zone;
	}
	for (const zone of zones) {
		for (const region of figure[zone]) {
			if (!(region in out)) out[region] = zone;
		}
	}
	return out;
}

function addDays(date: string, n: number): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

/** One cell per day of the history, oldest first, days with nothing included. */
export function soreStrip(history: { days: number; to: string; entries: { date: string; region: string; severity: number }[] }): SoreDay[] {
	const byDate = new Map<string, SoreDay>();
	const out: SoreDay[] = [];
	for (let i = history.days - 1; i >= 0; i--) {
		const day: SoreDay = { date: addDays(history.to, -i), severity: 0, zones: [] };
		byDate.set(day.date, day);
		out.push(day);
	}
	for (const e of history.entries) {
		const day = byDate.get(e.date);
		if (!day) continue;
		day.zones.push({ region: e.region, severity: e.severity });
		day.severity = Math.max(day.severity, e.severity);
	}
	return out;
}

/** The strip cell's fill: a step of the move red per severity. */
export function stripClass(severity: number): string {
	switch (severity) {
		case 3:
			return 'bg-day-move';
		case 2:
			return 'bg-day-move/55';
		case 1:
			return 'bg-day-move/25';
		default:
			return 'bg-muted';
	}
}
