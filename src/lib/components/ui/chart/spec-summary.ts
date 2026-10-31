// The text alternative for a SpecChart: one sentence per series (first and
// last point with their labels, low, high), so a screen reader gets what the
// pixels say. spec-chart.svelte puts it on the chart's role="img" and draws
// the same rows as a visually hidden table.

import type { Translator } from '#lib/i18n/index.js';
import type { ChartSpec } from './spec-types.js';

type Summarised = Pick<ChartSpec, 'data'>;

function num(i18n: Pick<Translator, 'decimal'>, v: number): string {
	return Number.isInteger(v) ? String(v) : i18n.decimal(v, 1);
}

/** One line per series; series with no points say so. */
export function seriesSummaries(i18n: Pick<Translator, 'tf' | 'decimal'>, spec: Summarised): string[] {
	const { labels, datasets } = spec.data;
	return datasets.map((d) => {
		const points = d.data
			.map((v, i) => ({ v, label: labels[i] ?? '' }))
			.filter((p): p is { v: number; label: string } => typeof p.v === 'number' && Number.isFinite(p.v));
		if (points.length === 0) return i18n.tf('layout.chart.series_empty', d.label);
		const first = points[0];
		const last = points[points.length - 1];
		const values = points.map((p) => p.v);
		return i18n.tf(
			'layout.chart.series',
			d.label,
			num(i18n, first.v),
			first.label,
			num(i18n, last.v),
			last.label,
			num(i18n, Math.min(...values)),
			num(i18n, Math.max(...values))
		);
	});
}

/** The chart's accessible name: an optional title, then every series. */
export function chartSummary(i18n: Pick<Translator, 't' | 'tf' | 'decimal'>, spec: Summarised, label?: string): string {
	const hasData = spec.data.labels.length > 0 && spec.data.datasets.length > 0;
	const body = hasData ? seriesSummaries(i18n, spec).join('. ') : i18n.t('layout.chart.empty');
	return i18n.tf('layout.chart.aria', label ? `${label}. ${body}` : body);
}

/** A table cell's text: the value, or an en dash for a gap. */
export function cellText(i18n: Pick<Translator, 'decimal'>, v: number | null | undefined): string {
	return typeof v === 'number' && Number.isFinite(v) ? num(i18n, v) : '–';
}
