import { describe, expect, it } from 'vitest';
import { createTranslator } from '#lib/i18n/index.js';
import { cellText, chartSummary, seriesSummaries } from './spec-summary.js';

const messages = {
	'layout.chart.aria': 'Chart. %[1]s',
	'layout.chart.empty': 'Chart with no data yet',
	'layout.chart.series': '%[1]s: from %[2]s (%[3]s) to %[4]s (%[5]s); low %[6]s; high %[7]s',
	'layout.chart.series_empty': '%[1]s: no data'
};
const en = createTranslator('en', messages, {});
const pt = createTranslator('pt-PT', messages, {});

const spec = {
	data: {
		labels: ['Mon', 'Tue', 'Wed', 'Thu'],
		datasets: [
			{ label: 'Mood', data: [null, 2, 5, 3] },
			{ label: 'Energy', data: [null, null, null, null] }
		]
	}
};

describe('SpecChart text alternative', () => {
	it('summarises each series from its first and last real point', () => {
		expect(seriesSummaries(en, spec)).toEqual(['Mood: from 2 (Tue) to 3 (Thu); low 2; high 5', 'Energy: no data']);
	});

	it('names the chart with an optional title before the series', () => {
		expect(chartSummary(en, spec, 'Mood and energy')).toBe(
			'Chart. Mood and energy. Mood: from 2 (Tue) to 3 (Thu); low 2; high 5. Energy: no data'
		);
		expect(chartSummary(en, { data: { labels: [], datasets: [] } })).toBe('Chart. Chart with no data yet');
	});

	it('formats decimals for the locale', () => {
		const s = { data: { labels: ['a', 'b'], datasets: [{ label: 'Water', data: [1.26, 2] }] } };
		expect(seriesSummaries(pt, s)[0]).toContain('1,3');
		expect(cellText(pt, 0.5)).toBe('0,5');
		expect(cellText(en, null)).toBe('–');
	});
});
