// The catalog's vocabularies and the labels for them (north-client
// web/exercises/exercises_view.go, internal/workouts/plan/muscle.go,
// internal/exercises/exercise).

import { capitalise } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

/** Results per browse page (Go: exercises.PageSize). */
export const PAGE_SIZE = 24;

/** How many related movements the detail page suggests (Go: similarLimit). */
export const SIMILAR_LIMIT = 4;

/** plan.MuscleGroups, in the order the filter offers them. */
export const muscleGroups = [
	'quads',
	'glutes',
	'hamstrings',
	'calves',
	'adductors',
	'traps',
	'delts',
	'biceps',
	'triceps',
	'forearms',
	'lats',
	'rhomboids',
	'erectors',
	'serratus',
	'abs',
	'chest',
	'neck'
] as const;

/** exercise.Categories */
export const categories = [
	'strength',
	'cardio',
	'stretching',
	'plyometrics',
	'powerlifting',
	'olympic_weightlifting',
	'strongman'
] as const;

/** The equipment values the catalog actually contains (Go: equipmentOptions). */
export const equipmentOptions = [
	'none',
	'barbell',
	'dumbbell',
	'kettlebell',
	'machine',
	'bench',
	'pull-up bar',
	'resistance band',
	'bike',
	'other'
] as const;

/** "olympic_weightlifting" → "Olympic weightlifting" (Go: humanize). */
export function humanize(value: string): string {
	if (!value) return '';
	const spaced = value.replaceAll('_', ' ');
	return spaced[0].toUpperCase() + spaced.slice(1);
}

/**
 * A stored value under prefix, spaces and hyphens folded to underscores, or
 * humanized when the catalogue does not know it (Go: vocabulary).
 */
function vocabulary(i18n: Translator, prefix: string, value: string): string {
	if (!value) return '';
	const key = prefix + value.replace(/[ -]/g, '_');
	return i18n.has(key) ? i18n.t(key) : humanize(value);
}

export const muscleLabel = (i18n: Translator, key: string) => vocabulary(i18n, 'exercises.muscle.', key);
export const categoryLabel = (i18n: Translator, v: string) => vocabulary(i18n, 'exercises.category.', v);
export const difficultyLabel = (i18n: Translator, v: string) => vocabulary(i18n, 'exercises.difficulty.', v);
export const equipmentLabel = (i18n: Translator, v: string) => vocabulary(i18n, 'exercises.equipment.', v);

/** The raw query-string filter, echoed back into the form (Go: Filters). */
export type Filters = { q: string; muscle: string; category: string; equipment: string };

export function filtersFrom(url: URL): Filters {
	const get = (k: string) => url.searchParams.get(k) ?? '';
	return { q: get('q'), muscle: get('muscle'), category: get('category'), equipment: get('equipment') };
}

/**
 * The filter at another page; every filter travels with the link and page 1
 * omits the parameter (Go: Filters.pageURL). Keys sorted as url.Values.Encode.
 */
export function pageURL(f: Partial<Filters>, page: number): string {
	const q = new URLSearchParams();
	const entries: [string, string | undefined][] = [
		['category', f.category],
		['equipment', f.equipment],
		['muscle', f.muscle],
		['q', f.q]
	];
	for (const [k, v] of entries) if (v) q.set(k, v);
	if (page > 1) q.set('page', String(page));
	q.sort();
	const s = q.toString();
	return s ? `/app/exercises?${s}` : '/app/exercises';
}

/** ?page=, 1-based; anything unparseable or below 1 is page 1 (Go: pageParam). */
export function pageParam(url: URL): number {
	const raw = url.searchParams.get('page') ?? '';
	const n = /^\d+$/.test(raw) ? Number(raw) : NaN;
	return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Never 0: an empty result still has a page 1 (Go: lastPage). */
export function lastPage(total: number): number {
	return total <= 0 ? 1 : Math.ceil(total / PAGE_SIZE);
}

/** Which slice of the results is on screen (Go: summary). */
export function summary(i18n: Translator, shown: number, total: number, firstRow: number): string {
	if (shown === total) return i18n.tf('exercises.browse.count', total);
	return i18n.tf('exercises.browse.range', firstRow, firstRow + shown - 1, total);
}

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** A plan's English weekday in the reader's language, capitalised (Go: weekdayName). */
export function weekdayName(i18n: Translator, label: string): string {
	const trimmed = label.trim();
	const d = weekdays.indexOf(trimmed.toLowerCase());
	return d < 0 ? trimmed : capitalise(i18n.t(`weekday.long.${d}`));
}

/** One plan day as the "add to" choice sees it (Go: PlanDayOption). */
export type PlanDayOption = { index: number; weekday: string; focus: string; includes: boolean };

/** "Monday · Upper" (Go: dayLabel). */
export function dayLabel(i18n: Translator, day: PlanDayOption): string {
	const name = weekdayName(i18n, day.weekday);
	return day.focus ? `${name} · ${day.focus}` : name;
}
