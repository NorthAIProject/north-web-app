// View helpers for the memories page (north-client web/memories/group.go,
// internal/memories/view.go, and the categoryLabel in memories.templ).

import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';
import type { EChartsOption } from '#lib/components/khepri/echarts.js';

export type Memory = components['schemas']['Memory'];

/** memory.Categories, in product order. */
export const categories = [
	'preference',
	'constraint',
	'habit',
	'injury',
	'equipment',
	'schedule',
	'coaching',
	'general'
] as const;

export const CATEGORY_GENERAL = 'general';

/** A stored category in the reader's language; one with no copy shows as stored. */
export function categoryLabel(i18n: Pick<Translator, 't' | 'has'>, category: string): string {
	const key = `memories.category.${category}`;
	return i18n.has(key) ? i18n.t(key) : category;
}

/** A newer fact replaced this one (memory.IsSuperseded). */
export const isSuperseded = (m: Memory) => Boolean(m.validTo);

/** This proposal would replace an existing fact (memory.ProposesSupersession). */
export const proposesSupersession = (m: Memory) => Boolean(m.supersedesId);

export type CategoryGroup = { category: string; items: Memory[] };

/**
 * Approved facts grouped by category (Go: GroupApprovedByCategory). Product
 * categories first, unknown ones after in name order; within a group pinned
 * first, excluded last, then most recently changed.
 */
export function groupApprovedByCategory(list: Memory[]): CategoryGroup[] {
	const byCat = new Map<string, Memory[]>();
	for (const m of list) {
		const cat = m.category || CATEGORY_GENERAL;
		byCat.set(cat, [...(byCat.get(cat) ?? []), m]);
	}
	const known = new Set<string>(categories);
	const extra = [...byCat.keys()].filter((c) => !known.has(c)).sort();
	const order = [...categories, ...extra];

	const out: CategoryGroup[] = [];
	for (const cat of order) {
		const items = byCat.get(cat);
		if (!items) continue;
		const sorted = [...items].sort((a, b) => {
			if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
			if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
			return Date.parse(b.updatedAt ?? b.createdAt) - Date.parse(a.updatedAt ?? a.createdAt);
		});
		out.push({ category: cat, items: sorted });
	}
	return out;
}

export type Instruments = {
	pendingCount: number;
	approvedCount: number;
	pinnedCount: number;
	categoryDonut: EChartsOption | null;
};

/** viz.donutPalette: North tokens, resolved against the live theme. */
const donutPalette = [
	'var(--north-signal)',
	'var(--north-agent)',
	'var(--north-ember)',
	'var(--north-sport-walk)',
	'var(--north-day-protein)',
	'var(--north-sport-swim)',
	'var(--north-day-move)',
	'var(--north-sport-ride)',
	'var(--north-sport-other)'
];

/** viz.DonutOptionJSON for the approved facts per category. */
function donutOption(segments: { label: string; value: number }[]): EChartsOption {
	return {
		color: donutPalette,
		tooltip: { trigger: 'item' },
		legend: {
			show: true,
			type: 'scroll',
			top: 0,
			itemWidth: 8,
			itemHeight: 8,
			icon: 'circle',
			textStyle: { color: 'var(--muted-foreground)', fontSize: 11 },
			pageTextStyle: { color: 'var(--muted-foreground)' }
		},
		series: [
			{
				name: 'split',
				type: 'pie',
				radius: ['50%', '70%'],
				center: ['50%', '56%'],
				itemStyle: { borderColor: 'var(--card)', borderWidth: 2 },
				label: { show: false },
				data: segments.filter((s) => s.value > 0).map((s) => ({ name: s.label, value: s.value }))
			}
		]
	};
}

/** The header instruments (Go: buildInstruments). */
export function buildInstruments(pending: Memory[], approved: Memory[]): Instruments {
	let pinned = 0;
	const byCategory = new Map<string, number>();
	for (const m of approved) {
		if (m.pinned) pinned++;
		const cat = m.category || CATEGORY_GENERAL;
		byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
	}
	// Only product categories make the donut, as in Go.
	const segments = categories
		.map((cat) => ({ label: cat, value: byCategory.get(cat) ?? 0 }))
		.filter((s) => s.value > 0);
	return {
		pendingCount: pending.length,
		approvedCount: approved.length,
		pinnedCount: pinned,
		categoryDonut: segments.length > 0 ? donutOption(segments) : null
	};
}
