// The hero's card wall (north-client web/landing/herowall.go): a fan of small
// cards along the bottom of the hero, each a fragment of what Khepri keeps — a
// memory, a streak, a check-in, a plan. Decorative, so it is aria-hidden and
// holds nothing focusable. The geometry lives in app.css under .hero-wall.

type T = (key: string) => string;

export type WallKind =
	| 'memory'
	| 'streak'
	| 'quote'
	| 'sleep'
	| 'goal'
	| 'habits'
	| 'journal'
	| 'telegram'
	| 'plan'
	| 'lift'
	| 'image';

/** One card's content. Fields a kind does not use stay empty. */
export type WallCard = {
	kind: WallKind;
	label?: string;
	title?: string;
	body?: string;
	meta?: string;
	lines?: string[];
	image?: string;
	/** Image fills the card rather than sitting on it. */
	cover?: boolean;
};

/** Every card the wall can show; wallFront and wallBack decide where each sits. */
export function wallDeck(t: T): WallCard[] {
	return [
		{ kind: 'streak', title: t('land.wall.streak'), meta: t('land.wall.streak.sub') },
		{ kind: 'journal', label: t('land.wall.journal'), body: t('land.wall.journal.body') },
		{
			kind: 'memory',
			label: t('land.wall.memory'),
			title: t('land.wall.memory.day'),
			body: t('land.wall.memory.body'),
			meta: t('land.wall.memory.note')
		},
		{ kind: 'habits', label: t('land.wall.habits'), meta: t('land.wall.habits.sub') },
		{ kind: 'goal', label: t('land.wall.goal'), title: t('land.wall.goal.title'), body: '62%', meta: t('land.wall.goal.sub') },
		{ kind: 'sleep', label: t('land.wall.sleep'), title: '84', body: '7h 32m', meta: t('land.wall.sleep.sub') },
		{ kind: 'lift', label: t('land.wall.lift'), title: t('land.wall.lift.title'), meta: t('land.wall.lift.sub') },
		{ kind: 'quote', body: t('land.wall.quote'), meta: t('land.wall.quote.meta') },
		{ kind: 'image', label: t('land.wall.icon'), image: '/assets/brand/hero/khepri-app-icon.webp' },
		{
			kind: 'plan',
			label: t('land.wall.plan'),
			title: t('land.wall.plan.title'),
			lines: [t('land.wall.plan.1'), t('land.wall.plan.2'), t('land.wall.plan.3')]
		},
		{ kind: 'image', label: t('land.wall.mascot'), image: '/assets/brand/hero/khepri-mascot.webp' },
		{ kind: 'image', label: t('land.wall.poster'), image: '/assets/video/north-hero-poster.webp', cover: true },
		{ kind: 'telegram', body: t('land.wall.tg.user'), meta: t('land.wall.tg.reply') }
	];
}

// Deck indexes, left to right. Neighbours differ, and the five front cards a
// phone shows (0, 4, 7, 10, 14) carry the claim on their own.
const wallFront = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 5, 2, 12];
const wallBack = [9, 5, 12, 11, 1, 6, 3, 2, 0, 4, 8, 1, 7, 6];

export type WallSlot = { card: WallCard; style: string; class: string };

/** Go's math.Round: half away from zero. */
const round = (x: number) => Math.sign(x) * Math.round(Math.abs(x));

/**
 * One card's position. Cards nearer the middle stack on top, and the sway
 * delays cycle through five offsets so neighbours never move together.
 */
function slotStyle(x: number, rot: number, y: number, i: number, mid: number): string {
	const z = 20 - round(Math.abs(i - mid));
	return `--x:${x.toFixed(2)}%;--rot:${rot.toFixed(1)}deg;--y:${y.toFixed(1)}%;--delay:${(0.7 * (i % 5)).toFixed(1)}s;z-index:${z}`;
}

/** Keeps the wall readable as the viewport narrows. */
function frontVisibility(i: number): string {
	if ([0, 4, 7, 10, 14].includes(i)) return '';
	if ([2, 5, 9, 12].includes(i)) return 'hidden md:block';
	return 'hidden lg:block';
}

/**
 * The front row: 15 cards from 0% to 100%, rotation +21deg to -21deg, sitting
 * lower towards the edges so the row bleeds off the bottom.
 */
export function frontSlots(deck: WallCard[]): WallSlot[] {
	const n = wallFront.length;
	const mid = (n - 1) / 2;
	return wallFront.map((d, i) => {
		const off = (i - mid) / mid;
		return {
			card: deck[d],
			style: slotStyle((i * 100) / (n - 1), 21 - 3 * i, 20 + 16.8 * off * off, i, mid),
			class: frontVisibility(i)
		};
	});
}

/** The back row, shown from md: 14 cards between the front ones, arched up in the middle. */
export function backSlots(deck: WallCard[]): WallSlot[] {
	const n = wallBack.length;
	const mid = (n - 1) / 2;
	const step = 100 / n;
	return wallBack.map((d, i) => {
		const off = (i - mid) / mid;
		return {
			card: deck[d],
			style: slotStyle(step / 2 + i * step, 15.6 - 2.4 * i, -14.6 + 18.6 * off * off, i, mid),
			class: ''
		};
	});
}

/** The habit card's five weeks, Monday first. true is a day the habit was done. */
export const wallHabitGrid: boolean[][] = [
	[true, false, true, true, false, true, false],
	[true, true, false, true, true, false, true],
	[false, true, true, true, false, true, true],
	[true, true, true, false, true, true, true],
	[true, true, true, true, true, true, false]
];
