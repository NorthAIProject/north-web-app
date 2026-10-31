// My Day's view model: a port of north-client internal/day/handler.go
// (BuildView and its helpers) and web/day/view.go (BuildRail, SleepBars, the
// gauge geometry). The page is built from GET /day, so every number, label and
// position is decided here, in one pure function, and the components only
// place what it returns — the same split as Go.

import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import { REGIONS } from '#lib/components/khepri/bodymap.js';
import type { BodyMap, BodyShape } from '#lib/components/khepri/types.js';

type Schemas = components['schemas'];
export type DayResponse = Schemas['DayResponse'];
export type DayRules = Schemas['DayRulesResponse'];
export type DayStreakTile = Schemas['DayStreakTile'];
export type DayTrends = Schemas['DayTrends'];

// ---------------------------------------------------------------------------
// View types (web/day/view.go)
// ---------------------------------------------------------------------------

export type Vital = {
	key: string;
	label?: string;
	/** "" renders a dash. */
	value: string;
	unit: string;
	fraction: number;
	color: string;
};

export type Macro = {
	key: 'protein' | 'carb' | 'fat';
	letter: string;
	grams: string;
	goal: string;
	fraction: number;
	color: string;
	radius: number;
};

export type FoodCard = { calories: string; hasGoal: boolean; goal: string; macros: Macro[] };
export type WaterCard = { totalMl: string; targetMl: string; litres: string; fraction: number };
export type Ring = { key: string; value: string; goal: string; unit: string; fraction: number; color: string; radius: number };
export type SleepBar = { x: string; y: string; w: string; color: string };
export type SleepStageRow = { key: string; minutes: string; color: string };
export type SleepCard = {
	logged: boolean;
	hours: string;
	minutes: string;
	span: string;
	hasStages: boolean;
	stages: SleepStageRow[];
	bars: SleepBar[];
	quality: string;
};
export type WorkoutsCard = { count: number; minutes: string; labels: string[] };
export type FastCard = {
	active: boolean;
	shown: boolean;
	elapsed: string;
	phase: string;
	target: string;
	fraction: number;
	started: string;
};
export type NutrientsCard = { covered: number; total: number; missing: string[] };
export type MilestoneRow = { id: string; name: string; months: string; due: boolean };
export type Preset = { key: string; label: string; value: string };
export type RuleRow = { kind: string; at: string; enabled: boolean };

export type BodyCard = {
	hasWeight: boolean;
	weight: string;
	hasBmi: boolean;
	bmi: string;
	bmiCategory: string;
	hasGoal: boolean;
	target: string;
	toGoal: string;
	hasBloodPressure: boolean;
	bloodPressure: string;
	soreness: { region: string; severity: number }[];
	heightMissing: boolean;
	/** Null when the map could not be read: the figure is drawn untrained. */
	map: BodyMap | null;
	progressDue: boolean;
	lastWaist: string;
	lastCheckOn: string;
	shape: BodyShape | null;
};

export type RailHour = { label: string; topPx: number };
export type RailItem = {
	topPx: number;
	time: string;
	title: string;
	detail: string;
	href: string;
	color: string;
	icon: string;
	faded: boolean;
};
export type RailMarker = { topPx: number; kind: string; time: string; passed: boolean };
export type RailBand = { topPx: number; heightPx: number; kind: string; label: string; open: boolean };
export type Rail = {
	heightPx: number;
	hours: RailHour[];
	items: RailItem[];
	markers: RailMarker[];
	bands: RailBand[];
	showNow: boolean;
	nowTopPx: number;
	nowLabel: string;
};

export type StreakTile = {
	streak: number;
	version: string;
	/** Null until today's check-in exists. */
	today: { mood: number; energy: number; at: string } | null;
};

export type DayView = {
	date: string;
	dateLabel: string;
	isToday: boolean;
	prevHref: string;
	nextHref: string;
	todayHref: string;
	vitals: Vital[];
	food: FoodCard;
	water: WaterCard;
	activity: { rings: Ring[] };
	sleep: SleepCard;
	workouts: WorkoutsCard;
	streak: number;
	level: number;
	streakTile: StreakTile;
	body: BodyCard;
	fast: FastCard;
	nutrients: NutrientsCard;
	milestones: MilestoneRow[];
	caffeinePresets: Preset[];
	supplementPresets: Preset[];
	regions: string[];
	rail: Rail;
	rules: RuleRow[];
};

/** What GET /day leaves to other endpoints; each is optional, as in Go. */
export type BodyExtras = {
	map: Schemas['BodyMap'] | null;
	morph: Schemas['BodyMorph'] | null;
	progress: Schemas['ProgressChecks'] | null;
};

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const clamp01 = (f: number) => Math.max(0, Math.min(1, f));
const arcSweep = 75; // 270° of a 360° pathLength=100 circle

/** A gauge fill on a pathLength=100 circle drawn as a 270° arc. */
export const arcDash = (f: number) => `${(clamp01(f) * arcSweep).toFixed(2)} 100`;
/** The unfilled track behind a gauge. */
export const arcTrack = () => `${arcSweep.toFixed(0)} 100`;
/** Fills a full ring to f. */
export const ringDash = (f: number) => `${(clamp01(f) * 100).toFixed(2)} 100`;
/** Where the water line sits inside the glass: y=12 full, y=58 empty. */
export const fillY = (fraction: number) => (58 - 46 * clamp01(fraction)).toFixed(1);

// ---------------------------------------------------------------------------
// Dates in the reader's zone
// ---------------------------------------------------------------------------

/** UTC offset of timeZone at instant t, in milliseconds. */
function offsetAt(t: number, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hourCycle: 'h23'
	}).formatToParts(new Date(t));
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
	const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
	return wall - Math.floor(t / 1000) * 1000;
}

/** The instant a YYYY-MM-DD date begins in timeZone. */
export function zonedMidnight(date: string, timeZone: string): Date {
	const [y, m, d] = date.split('-').map(Number);
	const guess = Date.UTC(y, m - 1, d);
	let t = guess - offsetAt(guess, timeZone);
	// Once more, for a midnight on the other side of a DST change.
	t = guess - offsetAt(t, timeZone);
	return new Date(t);
}

/** date ± n days, as YYYY-MM-DD. */
export function addDays(date: string, n: number): string {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Go's day.FormatMinutes: "45m", "2h", "7h 13m". */
export function formatMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes}m`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Go's durfmt.HoursMinutes: "12h 05m". */
export function hoursMinutes(minutes: number): string {
	return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

const roundHalfUp = (v: number, scale: number) => {
	const f = 10 ** scale;
	return Math.round(v * f + Number.EPSILON * Math.sign(v)) / f;
};

const fixed0 = (v: number) => v.toFixed(0);

// ---------------------------------------------------------------------------
// Rail (web/day/view.go BuildRail)
// ---------------------------------------------------------------------------

const railPxPerHour = 60;
const railRowPx = 50;
const railDayStart = 6 * 60;
const railDayEnd = 24 * 60;
const railMinStart = -6 * 60;
const railMaxEnd = 29 * 60;

export type RailInput = { at: Date; title: string; detail: string; href: string; color: string; icon: string };
export type MarkerInput = { at: Date; kind: string; passed: boolean };
export type BandInput = { start: Date; end: Date | null; kind: string; label: string };

/**
 * Lays a day out, latest at the top: 06:00 to midnight of the date,
 * stretched to take in anything nearby (an entry at 04:00, a meal after
 * midnight, a fast begun the evening before). Entries outside the date are
 * faded.
 */
export function buildRail(
	midnight: Date,
	items: RailInput[],
	markers: MarkerInput[],
	bands: BandInput[],
	now: Date,
	isToday: boolean,
	clock: (t: Date) => string
): Rail {
	const minute = (t: Date) => Math.round((t.getTime() - midnight.getTime()) / 60_000);
	const clampMin = (m: number) => Math.max(railMinStart, Math.min(railMaxEnd, m));

	let lo = railDayStart;
	let hi = railDayEnd;
	for (const it of items) {
		const m = clampMin(minute(it.at));
		lo = Math.min(lo, m);
		hi = Math.max(hi, m);
	}
	const bandEnd = (b: BandInput) => b.end ?? now;
	for (const b of bands) {
		lo = Math.min(lo, clampMin(minute(b.start)));
		hi = Math.max(hi, clampMin(minute(bandEnd(b))));
	}
	if (isToday) hi = Math.max(hi, clampMin(minute(now) + 30));

	const startHour = Math.floor(lo / 60);
	const endHour = Math.ceil(hi / 60);
	const top = endHour * 60;

	const rail: Rail = {
		heightPx: (endHour - startHour) * railPxPerHour,
		hours: [],
		items: [],
		markers: [],
		bands: [],
		showNow: false,
		nowTopPx: 0,
		nowLabel: ''
	};
	const y = (t: Date) => Math.round(((top - clampMin(minute(t))) / 60) * railPxPerHour);

	for (let h = endHour; h >= startHour; h--) {
		rail.hours.push({ label: `${String(((h % 24) + 24) % 24).padStart(2, '0')}:00`, topPx: (endHour - h) * railPxPerHour });
	}

	for (const b of bands) {
		const end = bandEnd(b);
		if (end.getTime() <= b.start.getTime()) continue;
		const t = y(end);
		const bottom = y(b.start);
		if (bottom - t < 4) continue;
		rail.bands.push({ topPx: t, heightPx: bottom - t, kind: b.kind, label: b.label, open: b.end === null });
	}

	// Stable sort, latest first.
	const sorted = items
		.map((it, i) => ({ it, i }))
		.sort((a, b) => b.it.at.getTime() - a.it.at.getTime() || a.i - b.i)
		.map((x) => x.it);
	let last = -railRowPx;
	for (const it of sorted) {
		const at = Math.max(y(it.at), last + railRowPx);
		last = at;
		const m = minute(it.at);
		rail.items.push({
			topPx: at,
			time: clock(it.at),
			title: it.title,
			detail: it.detail,
			href: it.href,
			color: it.color,
			icon: it.icon,
			faded: m < 0 || m >= railDayEnd
		});
	}

	for (const m of markers) {
		rail.markers.push({ topPx: y(m.at), kind: m.kind, time: clock(m.at), passed: m.passed });
	}

	if (isToday) {
		rail.showNow = true;
		rail.nowTopPx = y(now);
		rail.nowLabel = clock(now);
	}

	// Cards spilling below the last hour stretch the rail rather than being cut off.
	if (rail.items.length > 0) {
		const bottom = rail.items[rail.items.length - 1].topPx + railRowPx;
		if (bottom > rail.heightPx) rail.heightPx = bottom;
	}
	return rail;
}

/** Hypnogram blocks in a 100×40 box: awake at the top, deep at the bottom. */
export function sleepBars(
	blocks: { stage: string; start: Date; end: Date }[],
	start: Date,
	end: Date,
	colors: Record<string, string>
): SleepBar[] {
	const total = (end.getTime() - start.getTime()) / 60_000;
	if (total <= 0) return [];
	const rows: Record<string, number> = { awake: 0, rem: 10, core: 20, deep: 30 };
	return blocks.map((b) => {
		const x = ((b.start.getTime() - start.getTime()) / 60_000 / total) * 100;
		const w = Math.max(((b.end.getTime() - b.start.getTime()) / 60_000 / total) * 100, 0.6);
		return { x: x.toFixed(2), y: (rows[b.stage] ?? 0).toFixed(0), w: w.toFixed(2), color: colors[b.stage] ?? '' };
	});
}

// ---------------------------------------------------------------------------
// BuildView (internal/day/handler.go)
// ---------------------------------------------------------------------------

const stageColors: Record<string, string> = {
	awake: 'var(--color-day-move)',
	rem: 'var(--color-day-stand)',
	core: 'var(--color-day-water)',
	deep: 'var(--color-day-sleep)'
};

/** Timeline kinds' colours (handler.go kindColor). */
export function kindColor(kind: string): string {
	switch (kind) {
		case 'food':
			return 'var(--color-day-food)';
		case 'hydration':
			return 'var(--color-day-water)';
		case 'sleep':
			return 'var(--color-day-sleep)';
		case 'activity':
			return 'var(--color-day-fat)';
		case 'checkin':
		case 'habit':
			return 'var(--color-ember)';
		case 'journal':
			return 'var(--color-agent)';
		case 'caffeine':
			return 'var(--color-day-caffeine)';
		case 'supplement':
			return 'var(--color-day-protein)';
		case 'fasting':
			return 'var(--color-day-fat)';
		default:
			return 'var(--color-signal)';
	}
}

/** The screen-time gauge's budget (internal/screentime/screen.DailyLimitMinutes). */
const screenLimitMinutes = 240;

export function buildDayView(
	i18n: Translator,
	d: DayResponse,
	rules: DayRules | null,
	extras: BodyExtras,
	timeZone: string
): DayView {
	const midnight = zonedMidnight(d.date, timeZone);
	const now = new Date(d.now);
	const clock = (t: Date) => formatTime(i18n.locale, t, '15:04', timeZone);
	const hrefFor = (date: string) => `/app?date=${date}`;

	const v = d.vitals;
	const vitals: Vital[] = [
		{
			key: 'caffeine',
			value: String(d.caffeine.activeMg),
			unit: 'mg',
			fraction: d.caffeine.totalMg / Math.max(d.caffeine.limitMg, 1),
			color: 'var(--color-day-caffeine)'
		},
		v.energyPercent == null
			? { key: 'energy', value: '', unit: '%', fraction: 0, color: 'var(--color-day-move)' }
			: { key: 'energy', value: String(v.energyPercent), unit: '%', fraction: v.energyPercent / 100, color: 'var(--color-day-move)' },
		v.daylightMinutes == null
			? { key: 'sunlight', value: '', unit: 'min', fraction: 0, color: 'var(--color-day-sun)' }
			: { key: 'sunlight', value: String(v.daylightMinutes), unit: 'min', fraction: v.daylightMinutes / 60, color: 'var(--color-day-sun)' },
		v.screenMinutes == null
			? { key: 'screen', value: '', unit: '', fraction: 0, color: 'var(--color-day-screen)' }
			: {
					key: 'screen',
					value: formatMinutes(v.screenMinutes),
					unit: '',
					fraction: v.screenMinutes / screenLimitMinutes,
					color: 'var(--color-day-screen)'
				},
		trackerVital(d)
	];

	const frac = (val: number, goal: number) => (goal <= 0 ? 0 : val / goal);
	const g = d.food.goal;
	const food: FoodCard = {
		calories: fixed0(d.food.calories),
		hasGoal: Boolean(g),
		goal: fixed0(g?.calories ?? 0),
		macros: [
			{ key: 'protein', letter: 'P', grams: fixed0(d.food.proteinG), goal: fixed0(g?.proteinG ?? 0), fraction: frac(d.food.proteinG, g?.proteinG ?? 0), color: 'var(--color-day-protein)', radius: 33 },
			{ key: 'carb', letter: 'C', grams: fixed0(d.food.carbG), goal: fixed0(g?.carbG ?? 0), fraction: frac(d.food.carbG, g?.carbG ?? 0), color: 'var(--color-day-carb)', radius: 24 },
			{ key: 'fat', letter: 'F', grams: fixed0(d.food.fatG), goal: fixed0(g?.fatG ?? 0), fraction: frac(d.food.fatG, g?.fatG ?? 0), color: 'var(--color-day-fat)', radius: 15 }
		]
	};

	const water: WaterCard = {
		totalMl: String(d.water.totalMl),
		targetMl: String(d.water.targetMl),
		litres: `${i18n.decimal(d.water.totalMl / 1000, 1)} L`,
		fraction: d.water.targetMl <= 0 ? 0 : Math.min(d.water.totalMl / d.water.targetMl, 1)
	};

	const ring = (key: string, r: Schemas['DayRing'], unit: string, color: string, radius: number): Ring => ({
		key,
		value: fixed0(r.value),
		goal: fixed0(r.goal),
		unit,
		fraction: r.goal <= 0 ? 0 : Math.min(r.value / r.goal, 1),
		color,
		radius
	});

	const entries = d.around ?? d.timeline;
	const items: RailInput[] = entries.map((e) => ({
		at: new Date(e.at),
		title: e.kind === 'caffeine' && e.presetKey ? i18n.t(`day.caffeine.${e.presetKey}`) : e.title,
		detail: e.detail ?? '',
		href: e.href ?? '',
		color: kindColor(e.kind),
		icon: e.icon
	}));
	const markers: MarkerInput[] = d.markers.map((m) => ({ at: new Date(m.at), kind: m.kind, passed: m.passed }));
	const bands: BandInput[] = [];
	if (d.sleep?.start && d.sleep.end) {
		bands.push({
			start: new Date(d.sleep.start),
			end: new Date(d.sleep.end),
			kind: 'sleep',
			label: i18n.tf('day.rail.sleep', formatMinutes(d.sleep.totalMinutes))
		});
	}
	for (const f of d.fasts ?? []) {
		const open = !f.endedAt;
		bands.push({
			start: new Date(f.startedAt),
			end: f.endedAt ? new Date(f.endedAt) : null,
			kind: 'fast',
			label: open ? i18n.tf('day.rail.fast_open', hoursMinutes(f.elapsedMinutes)) : i18n.tf('day.rail.fast', f.targetHours)
		});
	}

	const set = new Map((rules?.rules ?? []).map((r) => [r.kind, r]));
	const ruleRows: RuleRow[] = (rules?.kinds ?? []).map((k) => {
		const r = set.get(k);
		return { kind: k, at: r?.at ?? '', enabled: Boolean(r?.enabled) };
	});

	return {
		date: d.date,
		dateLabel: formatTime(i18n.locale, midnight, 'Monday, 2 January', timeZone),
		isToday: d.isToday,
		prevHref: hrefFor(addDays(d.date, -1)),
		nextHref: hrefFor(addDays(d.date, 1)),
		todayHref: '/app',
		vitals,
		food,
		water,
		activity: {
			rings: [
				ring('move', d.activity.move, 'kcal', 'var(--color-day-move)', 33),
				ring('exercise', d.activity.exercise, 'min', 'var(--color-day-exercise)', 23),
				ring('stand', d.activity.stand, 'h', 'var(--color-day-stand)', 13)
			]
		},
		sleep: sleepCard(d.sleep, clock),
		workouts: { count: d.workouts.count, minutes: String(d.workouts.minutes), labels: d.workouts.labels },
		streak: d.streak,
		level: d.level,
		streakTile: streakTile(d.checkIn, clock),
		body: bodyCard(i18n, d.body, extras),
		fast: fastCard(d.fast, d.isToday, timeZone),
		nutrients: { covered: d.nutrients.covered.length, total: d.nutrients.total, missing: d.nutrients.missing },
		milestones: d.milestones.map((m) => ({ id: m.id, name: m.name, months: String(m.monthsSince), due: m.due })),
		caffeinePresets: (d.presets?.caffeine ?? []).map((p) => ({ key: p.key, label: '', value: `${p.mg} mg` })),
		supplementPresets: (d.presets?.supplements ?? []).map((p) => ({ key: p.key, label: p.name, value: '' })),
		regions: d.presets?.sorenessRegions ?? [],
		rail: buildRail(midnight, items, markers, bands, now, d.isToday, clock),
		rules: ruleRows
	};
}

/**
 * The first "months since" tracker, named by the person; with none set up the
 * slot shows the streak so the strip is never a hole.
 */
function trackerVital(d: DayResponse): Vital {
	const m = d.milestones[0];
	if (!m) {
		// A streak has no goal, so the arc fills a week at a time.
		return { key: 'streak', value: String(d.streak), unit: 'd', fraction: (d.streak % 7) / 7, color: 'var(--color-ember)' };
	}
	return {
		key: 'tracker',
		label: m.name,
		value: String(m.monthsSince),
		unit: 'mo',
		fraction: m.fraction,
		color: m.due ? 'var(--color-day-move)' : 'var(--color-day-stand)'
	};
}

export function streakTile(tile: DayStreakTile | undefined, clock: (t: Date) => string): StreakTile {
	if (!tile) return { streak: 0, version: '', today: null };
	return {
		streak: tile.streak,
		version: tile.version,
		today: tile.today ? { mood: tile.today.mood, energy: tile.today.energy, at: clock(new Date(tile.today.updatedAt)) } : null
	};
}

function fastCard(f: Schemas['DayFast'] | undefined, isToday: boolean, timeZone: string): FastCard {
	if (!f) return { active: false, shown: false, elapsed: '', phase: '', target: '', fraction: 0, started: '' };
	const mins = f.elapsedMinutes;
	return {
		active: !f.endedAt && isToday,
		shown: true,
		elapsed: `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`,
		phase: f.phase,
		target: String(f.targetHours),
		fraction: f.fraction,
		// Go formats this with time.Format, in English, whatever the locale.
		started: formatTime('en', f.startedAt, 'Mon 15:04', timeZone)
	};
}

function sleepCard(s: Schemas['DaySleep'] | undefined, clock: (t: Date) => string): SleepCard {
	const empty: SleepCard = { logged: false, hours: '', minutes: '', span: '', hasStages: false, stages: [], bars: [], quality: '' };
	if (!s) return empty;
	const hasStages = Object.keys(s.stages ?? {}).length > 0;
	const out: SleepCard = {
		...empty,
		logged: true,
		hours: String(Math.floor(s.totalMinutes / 60)),
		minutes: String(s.totalMinutes % 60),
		hasStages,
		quality: s.quality != null ? `${s.quality}/5` : ''
	};
	if (s.start && s.end) out.span = `${clock(new Date(s.start))} – ${clock(new Date(s.end))}`;
	if (hasStages && s.start && s.end) {
		out.stages = ['deep', 'rem', 'core', 'awake'].map((st) => ({ key: st, minutes: String(s.stages[st] ?? 0), color: stageColors[st] }));
		out.bars = sleepBars(
			s.blocks.map((b) => ({ stage: b.stage, start: new Date(b.start), end: new Date(b.end) })),
			new Date(s.start),
			new Date(s.end),
			stageColors
		);
	}
	return out;
}

function bodyCard(i18n: Translator, b: Schemas['DayBody'], extras: BodyExtras): BodyCard {
	const out: BodyCard = {
		hasWeight: false,
		weight: '',
		hasBmi: false,
		bmi: '',
		bmiCategory: '',
		hasGoal: false,
		target: '',
		toGoal: '',
		hasBloodPressure: false,
		bloodPressure: '',
		soreness: b.soreness.map((s) => ({ region: s.region, severity: s.severity })),
		heightMissing: false,
		map: bodyMapOf(extras.map),
		progressDue: false,
		lastWaist: '',
		lastCheckOn: '',
		shape: null
	};
	if (b.targetWeightKg != null) out.target = b.targetWeightKg.toFixed(1);
	if (b.toGoalKg != null) {
		out.hasGoal = true;
		out.toGoal = i18n.decimal(b.toGoalKg, 1);
	}
	if (b.bloodPressure) {
		out.hasBloodPressure = true;
		out.bloodPressure = `${b.bloodPressure.systolic}/${b.bloodPressure.diastolic}`;
	}
	if (b.weightKg != null) {
		out.hasWeight = true;
		out.weight = i18n.decimal(b.weightKg, 1);
		out.heightMissing = b.heightCm == null;
	}
	if (b.bmi != null) {
		out.hasBmi = true;
		out.bmi = i18n.decimal(roundHalfUp(b.bmi, 1), 1);
		out.bmiCategory = b.bmiCategory ?? '';
	}

	const p = extras.progress;
	if (p) {
		out.progressDue = p.schedule.due;
		const latest = p.checks[0];
		if (latest?.waistCm != null) {
			out.lastWaist = latest.waistCm.toFixed(1).replace(/\.0$/, '');
			out.lastCheckOn = formatTime(i18n.locale, `${latest.measuredOn}T00:00:00Z`, '2 Jan', 'UTC');
		}
	}
	const m = extras.morph;
	if (m && (m.waist || m.hips || m.chest || m.overall)) out.shape = { waist: m.waist, hips: m.hips, chest: m.chest, overall: m.overall };
	return out;
}

/** GET /body/map in the figure's shape; null keeps the figure without heat. */
function bodyMapOf(m: Schemas['BodyMap'] | null): BodyMap | null {
	if (!m) return null;
	return {
		days: m.days,
		lastSession: m.lastSessionOn ?? null,
		regions: m.muscles.map((x) => ({ region: x.id, intensity: x.intensity, lastTrained: x.lastTrainedOn ?? null }))
	};
}

/** bodyMapOrEmpty: body-map mode with no heat when the map could not be read. */
export function bodyMapOrEmpty(m: BodyMap | null): BodyMap {
	return m ?? { days: 7, lastSession: null, regions: REGIONS.map((region) => ({ region, intensity: 0, lastTrained: null })) };
}

/** bodyCaption: why the figure is cold — never trained, or not lately. */
export function bodyCaption(i18n: Translator, m: BodyMap | null): string {
	if (!m) return '';
	if (!m.lastSession) return i18n.t('bodymap.empty');
	if (!m.regions.some((r) => r.intensity > 0)) return i18n.tf('day.body.quiet', m.days);
	return '';
}

/** The BMI word's colour: a tracker's text step, never its fill (4.5:1). */
export function bmiClass(category: string): string {
	switch (category) {
		case 'healthy':
			return 'text-day-food-text';
		case 'overweight':
			return 'text-day-fat-text';
		case 'obese':
			return 'text-day-move-text';
		default:
			return 'text-day-water-text';
	}
}

export function sorenessClass(severity: number): string {
	switch (severity) {
		case 3:
			return 'bg-day-move/20 text-day-move-text';
		case 2:
			return 'bg-day-move/12 text-day-move-text';
		default:
			return 'bg-muted text-muted-foreground';
	}
}

export function missingNames(i18n: Translator, keys: string[], limit: number): string {
	return keys
		.slice(0, limit)
		.map((k) => i18n.t(`day.nutrient.${k}`))
		.join(', ');
}

export function fastMeta(i18n: Translator, f: FastCard): string {
	return f.shown ? i18n.t(`day.fast.phase.${f.phase}`) : '';
}

// ---------------------------------------------------------------------------
// Trends (internal/day/handler.go BuildTrends, web/day/trends.templ)
// ---------------------------------------------------------------------------

export type TrendCard = { key: string; value: string; unit: string; count: number; window: number; line: string; color: string };
export type FastRow = { date: string; hours: string; target: string; fraction: number; met: boolean };

/** Go's day.Sparkline: polyline points in a width×height box. */
export function sparkline(points: { at: string; value: number }[], width: number, height: number): string {
	if (points.length === 0) return '';
	let lo = Infinity;
	let hi = -Infinity;
	for (const p of points) {
		lo = Math.min(lo, p.value);
		hi = Math.max(hi, p.value);
	}
	const first = new Date(points[0].at).getTime();
	const span = (new Date(points[points.length - 1].at).getTime() - first) / 1000;
	const out = points.map((p) => {
		const x = span > 0 ? ((new Date(p.at).getTime() - first) / 1000 / span) * width : width / 2;
		const y = hi > lo ? 2 + ((hi - p.value) / (hi - lo)) * (height - 4) : height / 2;
		return `${x.toFixed(1)},${y.toFixed(1)}`;
	});
	if (points.length === 1) out.push(`${width.toFixed(1)},${(height / 2).toFixed(1)}`);
	return out.join(' ');
}

const trendColors: Record<string, [string, number]> = {
	weight: ['var(--color-day-stand)', 1],
	systolic: ['var(--color-day-move)', 0],
	active_energy: ['var(--color-day-exercise)', 0],
	sleep: ['var(--color-day-sleep)', 1],
	caffeine: ['var(--color-day-caffeine)', 0]
};

export function buildTrends(i18n: Translator, t: DayTrends, timeZone: string): { cards: TrendCard[]; fasts: FastRow[] } {
	const cards = t.series.map((s) => {
		const [color, decimals] = trendColors[s.key] ?? ['var(--color-signal)', 0];
		return {
			key: s.key,
			value: i18n.decimal(s.headline, decimals),
			unit: s.unit,
			count: s.count,
			window: s.windowDays,
			line: sparkline(s.points, 100, 32),
			color
		};
	});
	const fasts = t.fasts.map((f) => ({
		// Go formats this with time.Format, in English, whatever the locale.
		date: formatTime('en', f.startedAt, 'Mon 2 Jan', timeZone),
		hours: i18n.decimal(f.hours, 1),
		target: String(f.targetHours),
		fraction: Math.min(f.hours / Math.max(f.targetHours, 1), 1),
		met: f.met
	}));
	return { cards, fasts };
}

export function trendMeta(i18n: Translator, c: TrendCard): string {
	return c.key === 'weight' || c.key === 'systolic'
		? i18n.tf('day.trend.readings', String(c.count))
		: i18n.tf('day.trend.days', String(c.window));
}
