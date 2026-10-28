import type { Translator } from '#lib/i18n/index.js';
import { destinations, groups, type Destination } from './destinations';
import { descriptionOf, groupLabel, labelOf } from './nav';

// The command palette's matcher (Go: web/assets/js/shared/command-palette.js).
// A substring test over a haystack of labels, descriptions, group and
// keywords, in both the reader's language and English, ranked label-prefix
// first so "nut" puts Nutrition above a page that merely mentions it.

export type PaletteRow = {
	index: number;
	destination: Destination;
	label: string;
	description: string;
	haystack: string;
};

const RANK = { prefix: 0, word: 1, substring: 2, tokens: 3, keywords: 4 } as const;
const BUCKET = 1000;

export function paletteRows(i18n: Translator): PaletteRow[] {
	const rows: PaletteRow[] = [];
	let index = 0;
	for (const group of groups) {
		index++; // the group heading takes an order slot, as in Go
		for (const d of destinations) {
			if (d.group !== group) continue;
			const label = labelOf(i18n, d);
			const description = descriptionOf(i18n, d);
			rows.push({
				index: index++,
				destination: d,
				label,
				description,
				haystack: [label, description, d.label, d.description, groupLabel(i18n, group), group, ...d.keywords]
					.join(' ')
					.toLowerCase()
			});
		}
	}
	return rows;
}

function tokens(q: string): string[] {
	const trimmed = q.trim().toLowerCase();
	return trimmed ? trimmed.split(/\s+/) : [];
}

function rank(row: PaletteRow, q: string): number {
	const query = q.trim().toLowerCase();
	if (!query) return row.index;
	const label = row.label.toLowerCase();
	let bucket: number = RANK.keywords;
	if (label.startsWith(query)) bucket = RANK.prefix;
	else if (label.split(/\s+/).some((w) => w.startsWith(query))) bucket = RANK.word;
	else if (label.includes(query)) bucket = RANK.substring;
	else if (tokens(query).every((t) => label.includes(t))) bucket = RANK.tokens;
	return bucket * BUCKET + row.index;
}

export function filterRows(rows: PaletteRow[], q: string): PaletteRow[] {
	const wanted = tokens(q);
	return rows
		.filter((row) => wanted.every((t) => row.haystack.includes(t)))
		.sort((a, b) => rank(a, q) - rank(b, q));
}
