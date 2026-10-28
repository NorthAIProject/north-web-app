// The leaderboard page's labels and boards (north-client internal/xp/handler.go,
// web/leaderboard/leaderboard.templ). Go built these strings in handler code
// from the xp rules; they are ported here with the same catalogue keys.

import type { Translator } from '#lib/i18n/index.js';

/** Boards in the order they are offered; key is the ?board= value. */
export const boards = [
	{ key: 'xp-week', labelKey: 'leaderboard.board.xp-week', metric: 'xp', period: 'week' },
	{ key: 'xp-all', labelKey: 'leaderboard.board.xp-all', metric: 'xp', period: 'all' },
	{ key: 'streak', labelKey: 'leaderboard.board.streak', metric: 'streak', period: undefined },
	{ key: 'workouts', labelKey: 'leaderboard.board.workouts', metric: 'workouts', period: undefined }
] as const;

export type Board = (typeof boards)[number];

/** An unknown ?board= is the first board rather than an error. */
export function boardFor(key: string | null): Board {
	return boards.find((b) => b.key === key) ?? boards[0];
}

// The xp rules the kind labels quote (internal/xp/xp.go, achievements.StreakMarks).
const WORKOUT_MIN_MINUTES = 10;
const WORKOUTS_PAID_PER_DAY = 2;
const STREAK_DAY_FROM = 3;
const STREAK_MARKS = [7, 30, 100, 365];

/** "7, 30, 100 or 365" (Go: markList). */
function markList(i18n: Translator): string {
	const marks = STREAK_MARKS.map(String);
	const last = marks.length - 1;
	return i18n.tf('xp.marks.or', marks.slice(0, last).join(', '), marks[last]);
}

/** What a kind pays for, rules included; an unknown kind reads as its code (Go: kindLabel). */
export function kindLabel(i18n: Translator, kind: string): string {
	switch (kind) {
		case 'workout':
			return i18n.tf('xp.kind.workout', WORKOUT_MIN_MINUTES, WORKOUTS_PAID_PER_DAY);
		case 'streak_day':
			return i18n.tf('xp.kind.streak_day', STREAK_DAY_FROM);
		case 'streak_mark':
			return i18n.tf('xp.kind.streak_mark', markList(i18n));
		case 'habit_kept':
		case 'milestone':
		case 'goal':
		case 'week_reviewed':
		case 'challenge_met':
			return i18n.t('xp.kind.' + kind);
	}
	return kind;
}

/** The sharing switch a metric needs, as the Friends page words it (Go: switchLabel). */
export function switchLabel(i18n: Translator, metric: string): string {
	return metric === 'xp' || metric === 'streak' || metric === 'workouts' ? i18n.t('xp.switch.' + metric) : '';
}

/** A board value in its unit (Go: valueText). */
export function valueText(i18n: Translator, metric: string, v: number): string {
	if (metric === 'streak') return v === 1 ? i18n.t('xp.value.day.one') : i18n.tf('xp.value.day.many', v);
	if (metric === 'workouts') return v === 1 ? i18n.t('xp.value.workout.one') : i18n.tf('xp.value.workout.many', v);
	// XP is the unit's name in every language North speaks.
	return `${v} XP`;
}

/** The first letter of a name (Go: leaderboard initials). */
export function initial(name: string): string {
	return [...name][0] ?? '?';
}
