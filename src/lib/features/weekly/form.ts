// The weekly review form (north-client web/weekly + internal/weekly/handler.go).

/** week.MaxPriorities */
export const MAX_PRIORITIES = 3;

export type Volume = 'hold' | 'build' | 'deload';

/** The three training choices; title and hint are catalogue keys. */
export const volumes: { value: Volume; title: string; hint: string }[] = [
	{ value: 'hold', title: 'weekly.volume.hold', hint: 'weekly.volume.hold.hint' },
	{ value: 'build', title: 'weekly.volume.build', hint: 'weekly.volume.build.hint' },
	{ value: 'deload', title: 'weekly.volume.deload', hint: 'weekly.volume.deload.hint' }
];

/** Three slots, filled from what was set or submitted. */
export function prioritySlots(priorities: string[] | undefined): string[] {
	const out = ['', '', ''];
	(priorities ?? []).slice(0, MAX_PRIORITIES).forEach((p, i) => (out[i] = p));
	return out;
}

/** The rank input's starting value: the saved rank, else list position. */
export function rankValue(priority: number, index: number): string {
	return String(priority > 0 ? priority : index + 1);
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reads the rank_<goal id> fields into goal ids, lowest rank first (Go:
 * goalOrder). Blank or invalid ranks go last; ties fall back to id order.
 */
export function goalOrder(form: FormData): string[] {
	const list: { id: string; rank: number }[] = [];
	for (const [key, value] of form.entries()) {
		if (!key.startsWith('rank_')) continue;
		const id = key.slice('rank_'.length);
		if (!uuidPattern.test(id)) continue;
		const raw = String(value).trim();
		let rank = /^[+-]?\d+$/.test(raw) ? Number(raw) : Number.NaN;
		if (!Number.isFinite(rank) || rank < 1) rank = 1 << 30;
		list.push({ id, rank });
	}
	list.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
	return list.map((g) => g.id);
}
