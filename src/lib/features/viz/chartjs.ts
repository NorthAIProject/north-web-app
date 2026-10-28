// Port of north-client internal/shared/viz/chartjs.go: the chart.Props Go
// built for templUI's Chart.js chart, now drawn by SpecChart
// (#lib/components/ui/chart, shadcn-svelte Chart on LayerChart). Same ids,
// classes, colours and flags as Go, so a chart reads the same on both apps.

import type { ChartSpec as UiChartSpec } from '#lib/components/ui/chart/index.js';

/** A chart's props plus the id it mounts under (Go chart.Props). */
export type ChartSpec = UiChartSpec & { id: string };

/** Zero and below become gaps (Go nullableSeries). */
function nullableSeries(values: number[]): (number | null)[] {
	return values.map((v) => (v <= 0 ? null : v));
}

/**
 * viz.MoodEnergyLine: two lines (mood and energy, 1–5), with dots, a legend and gaps
 * for days without a check-in. Go passed a raw Chart.js config whose defaults
 * showed both axes' labels and grids; those defaults are spelled out here.
 */
export function moodEnergyLine(
	id: string,
	labels: string[],
	mood: number[],
	energy: number[],
	names: { mood: string; energy: string } = { mood: 'Mood', energy: 'Energy' }
): ChartSpec {
	const line = (label: string, data: (number | null)[], colour: string) => ({
		label,
		data,
		tension: 0.35,
		borderWidth: 2,
		pointRadius: 3,
		borderColor: colour,
		backgroundColor: `color-mix(in oklch, ${colour} 12%, transparent)`,
		fill: false
	});
	return {
		id,
		variant: 'line',
		class: 'min-h-48 w-full',
		data: {
			labels,
			datasets: [
				line(names.mood, nullableSeries(mood), 'var(--north-signal)'),
				line(names.energy, nullableSeries(energy), 'var(--muted-foreground)')
			]
		},
		showLegend: true,
		showXLabels: true,
		showYLabels: true,
		showXGrid: true,
		showYGrid: true,
		// Go also wrote yMin 1 / yMax 5, but inside the raw Chart.js config
		// where Chart.js never reads them: the axis fits the data, as here.
		beginAtZero: false
	};
}

/** viz.SingleLine: one series with optional y bounds. */
export function singleLine(
	id: string,
	label: string,
	labels: string[],
	values: number[],
	yMin?: number,
	yMax?: number
): ChartSpec {
	return {
		id,
		variant: 'line',
		class: 'min-h-48 w-full',
		data: {
			labels,
			datasets: [
				{
					label,
					data: values,
					borderWidth: 2,
					tension: 0.35,
					borderColor: 'var(--north-signal)',
					backgroundColor: 'color-mix(in oklch, var(--north-signal) 12%, transparent)'
				}
			]
		},
		showLegend: false,
		showXGrid: false,
		showYGrid: true,
		showXLabels: true,
		showYLabels: true,
		yMin,
		yMax,
		beginAtZero: yMin === undefined
	};
}

/** viz.Bar: vertical bars. */
export function bar(id: string, datasetLabel: string, labels: string[], totals: number[]): ChartSpec {
	return {
		id,
		variant: 'bar',
		class: 'min-h-48 w-full',
		data: { labels, datasets: [{ label: datasetLabel, data: totals, borderWidth: 0, backgroundColor: 'var(--north-signal)' }] },
		showLegend: false,
		showXGrid: false,
		showYGrid: true,
		showXLabels: true,
		showYLabels: true,
		beginAtZero: true
	};
}

/** viz.Sparkline: a bar chart stripped to its shape. */
export function sparkline(id: string, labels: string[], values: number[]): ChartSpec {
	return {
		id,
		variant: 'bar',
		class: 'h-12 w-full',
		data: { labels, datasets: [{ label: '', data: values, borderWidth: 0, backgroundColor: 'var(--north-signal)' }] },
		showLegend: false,
		showXGrid: false,
		showYGrid: false,
		showXLabels: false,
		showYLabels: false,
		beginAtZero: true
	};
}

/** viz.BarSeries */
export type BarSeries = { label: string; values: number[] };

const barSeriesColours = ['var(--north-signal)', 'var(--muted-foreground)', 'var(--north-ember)'];

/** viz.GroupedBar: several named series over shared labels. */
export function groupedBar(id: string, labels: string[], series: BarSeries[]): ChartSpec {
	return {
		id,
		variant: 'bar',
		class: 'min-h-48 w-full',
		data: {
			labels,
			datasets: series.map((s, i) => ({
				label: s.label,
				data: s.values,
				borderWidth: 0,
				backgroundColor: barSeriesColours[i % barSeriesColours.length]
			}))
		},
		showLegend: true,
		showXGrid: false,
		showYGrid: true,
		showXLabels: true,
		showYLabels: true,
		beginAtZero: true
	};
}

/** viz.AreaLine: a filled trend line with no axes or grid. */
export function areaLine(id: string, labels: string[], values: number[], colorVar: string): ChartSpec {
	return {
		id,
		variant: 'line',
		class: 'h-28 w-full',
		data: {
			labels,
			datasets: [
				{
					label: '',
					data: values,
					borderWidth: 2,
					tension: 0.3,
					borderColor: colorVar,
					backgroundColor: `color-mix(in oklch, ${colorVar} 18%, transparent)`,
					fill: true
				}
			]
		},
		showLegend: false,
		showXGrid: false,
		showYGrid: false,
		showXLabels: false,
		showYLabels: false,
		beginAtZero: false
	};
}

/** viz.StackedBar: series stacked into one bar per label. */
export function stackedBar(id: string, labels: string[], series: BarSeries[]): ChartSpec {
	return { ...groupedBar(id, labels, series), stacked: true, showYGrid: false, showYLabels: false };
}
