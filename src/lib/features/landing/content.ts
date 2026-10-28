// Demo data for the landing sections that have state (north-client
// web/landing/demos.templ). Names and cues are copy and come from the
// catalogue; keys and roles are identifiers the 3D figure reads and stay as
// they are.

import { regionOf } from '#lib/components/khepri/bodymap.js';

type T = (key: string) => string;

export type Role = 'Primary' | 'Secondary' | 'Stabiliser';

/** One muscle group's share of an exercise, as a percentage of total work. */
export type MuscleLoad = { key: string; group: string; role: Role; share: number };

export type Exercise = { key: string; name: string; cue: string; loads: MuscleLoad[] };

/** The shares are illustrative. */
export function exercises(t: T): Exercise[] {
	const load = (key: string, group: string, role: Role, share: number): MuscleLoad => ({ key, group: t(group), role, share });
	return [
		{
			key: 'squat',
			name: t('land.ex.squat'),
			cue: t('land.ex.squat.cue'),
			loads: [
				load('quads', 'land.mus.quads', 'Primary', 38),
				load('glutes', 'land.mus.glutes', 'Primary', 27),
				load('erectors', 'land.mus.erectors', 'Secondary', 13),
				load('adductors', 'land.mus.adductors', 'Secondary', 12),
				load('hamstrings', 'land.mus.hamstrings', 'Stabiliser', 6),
				load('calves', 'land.mus.calves', 'Stabiliser', 4)
			]
		},
		{
			key: 'rdl',
			name: t('land.ex.rdl'),
			cue: t('land.ex.rdl.cue'),
			loads: [
				load('hamstrings', 'land.mus.hamstrings', 'Primary', 40),
				load('glutes', 'land.mus.glutes', 'Primary', 26),
				load('erectors', 'land.mus.erectors', 'Secondary', 18),
				load('lats', 'land.mus.lats', 'Stabiliser', 9),
				load('forearms', 'land.mus.forearms', 'Stabiliser', 7)
			]
		},
		{
			key: 'bench',
			name: t('land.ex.bench'),
			cue: t('land.ex.bench.cue'),
			loads: [
				load('chest', 'land.mus.chest', 'Primary', 42),
				load('triceps', 'land.mus.triceps', 'Primary', 22),
				load('delts', 'land.mus.delts', 'Secondary', 18),
				load('serratus', 'land.mus.serratus', 'Stabiliser', 10),
				load('abs', 'land.mus.abs', 'Stabiliser', 8)
			]
		},
		{
			key: 'press',
			name: t('land.ex.press'),
			cue: t('land.ex.press.cue'),
			loads: [
				load('delts', 'land.mus.delts', 'Primary', 34),
				load('triceps', 'land.mus.triceps', 'Primary', 24),
				load('traps', 'land.mus.traps.upper', 'Secondary', 16),
				load('serratus', 'land.mus.serratus', 'Secondary', 12),
				load('erectors', 'land.mus.erectors', 'Stabiliser', 8),
				load('abs', 'land.mus.abs', 'Stabiliser', 6)
			]
		},
		{
			key: 'pullup',
			name: t('land.ex.pullup'),
			cue: t('land.ex.pullup.cue'),
			loads: [
				load('lats', 'land.mus.lats', 'Primary', 37),
				load('biceps', 'land.mus.biceps', 'Primary', 21),
				load('rhomboids', 'land.mus.rhomboids', 'Secondary', 15),
				load('traps', 'land.mus.traps.lower', 'Secondary', 12),
				load('forearms', 'land.mus.forearms', 'Stabiliser', 9),
				load('abs', 'land.mus.abs', 'Stabiliser', 6)
			]
		}
	];
}

/** The figure region a muscle shows on: rhomboids light the upper back. */
export const figureRegion = (muscle: string) => regionOf(muscle) ?? muscle;

export function roleShade(role: Role): string {
	if (role === 'Primary') return 'bg-ember';
	if (role === 'Secondary') return 'bg-ember/55';
	return 'bg-ember/25';
}

/**
 * Shares are read as a proportion of the heaviest contributor rather than of
 * the whole, so a 6% stabiliser is still visible as a bar.
 */
export const barWidth = (share: number) => `${Math.min(100, Math.trunc((share * 5) / 2))}%`;

/** The loads the figure paints: the same numbers the readout shows. */
export const figureLoads = (ex: Exercise) => ex.loads.map((m) => ({ key: figureRegion(m.key), share: m.share, role: m.role }));

// ---------------------------------------------------------------------------
// Cross-surface continuity
// ---------------------------------------------------------------------------

export type SurfaceKey = 'web' | 'telegram' | 'discord' | 'whatsapp';
export type Surface = {
	key: SurfaceKey;
	name: string;
	chrome: string;
	gap: string;
	messages: { fromUser: boolean; body: string }[];
};

/** Surface names and their window chrome are product names; the conversation is copy. */
export function surfaces(t: T): Surface[] {
	return [
		{
			key: 'web',
			name: 'Web',
			chrome: 'north.app/coach',
			gap: t('land.surf.web.gap'),
			messages: [
				{ fromUser: true, body: t('land.surf.web.1') },
				{ fromUser: false, body: t('land.surf.web.2') }
			]
		},
		{
			key: 'telegram',
			name: 'Telegram',
			chrome: 'Khepri · online',
			gap: t('land.surf.tg.gap'),
			messages: [
				{ fromUser: true, body: t('land.surf.tg.1') },
				{ fromUser: false, body: t('land.surf.tg.2') }
			]
		},
		{
			key: 'discord',
			name: 'Discord',
			chrome: t('land.surf.dc.chrome'),
			gap: t('land.surf.dc.gap'),
			messages: [
				{ fromUser: true, body: t('land.surf.dc.1') },
				{ fromUser: false, body: t('land.surf.dc.2') }
			]
		},
		{
			key: 'whatsapp',
			name: 'WhatsApp',
			chrome: 'Khepri',
			gap: t('land.surf.wa.gap'),
			messages: [
				{ fromUser: false, body: t('land.surf.wa.1') },
				{ fromUser: true, body: t('land.surf.wa.2') }
			]
		}
	];
}
