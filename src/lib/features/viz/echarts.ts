// Port of north-client internal/shared/viz/echarts.go: ECharts options for
// #lib/components/khepri/EChart.svelte. Colours are "var(--token)" strings the
// mount resolves against the live theme. The JSON is what Go serialised, key
// for key, so the charts draw identically.

import type { EChartsOption } from '#lib/components/khepri/echarts.js';

function clampPercent(v: number): number {
	return v < 0 ? 0 : v > 100 ? 100 : v;
}

/** viz.GaugeOptionJSON: a signal arc over a hairline track, percent inside. */
export function gaugeOption(title: string, percent: number): EChartsOption {
	percent = clampPercent(percent);
	return {
		legend: { show: false },
		tooltip: { show: false },
		series: [
			{
				type: 'gauge',
				name: title,
				min: 0,
				max: 100,
				startAngle: 210,
				endAngle: -30,
				radius: '90%',
				center: ['50%', '55%'],
				progress: { show: true, width: 10, roundCap: true, itemStyle: { color: 'var(--north-signal)' } },
				axisLine: { roundCap: true, lineStyle: { width: 10, color: [[1, 'var(--border)']] } },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: { show: false },
				pointer: { show: false },
				anchor: { show: false },
				title: { show: false },
				detail: {
					valueAnimation: true,
					formatter: '{value}%',
					color: 'var(--foreground)',
					fontSize: 20,
					fontWeight: 600,
					offsetCenter: ['0', '0']
				},
				data: [{ value: percent, name: title }]
			}
		]
	};
}

/** viz.HeatmapCell: one day in a mood heatmap; value 1–5, zero omitted. */
export type HeatmapCell = { label: string; value: number };

/** viz.HeatmapJSON, as go-echarts serialised it. */
export function heatmapOption(rowLabel: string, cells: HeatmapCell[]): EChartsOption {
	const labels: string[] = [];
	const data: { value: number[] }[] = [];
	for (const c of cells) {
		if (c.value <= 0) continue;
		data.push({ value: [labels.length, 0, c.value] });
		labels.push(c.label);
	}
	return {
		color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
		legend: {},
		series: [
			{
				name: 'value',
				type: 'heatmap',
				data,
				label: { show: false },
				emphasis: { itemStyle: { borderColor: 'var(--foreground)' } }
			}
		],
		title: { show: false },
		toolbox: {},
		tooltip: {},
		visualMap: [
			{
				calculable: false,
				min: 1,
				max: 5,
				inRange: { color: ['color-mix(in oklch, var(--north-signal) 20%, var(--background))', 'var(--north-signal)'] },
				left: 'center',
				bottom: '0%',
				orient: 'horizontal',
				textStyle: { color: 'var(--muted-foreground)' }
			}
		],
		xAxis: [
			{
				type: 'category',
				data: labels,
				splitArea: { show: true },
				axisLabel: { show: true, showMinLabel: null, showMaxLabel: null, color: 'var(--muted-foreground)' }
			}
		],
		yAxis: [
			{
				type: 'category',
				data: [rowLabel],
				splitArea: { show: true },
				axisLabel: { show: false, showMinLabel: null, showMaxLabel: null }
			}
		]
	};
}

/** viz.DonutSegment */
export type DonutSegment = { label: string; value: number };

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

/** viz.DonutOptionJSON: a donut for category splits. */
export function donutOption(segments: DonutSegment[]): EChartsOption {
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

/** viz.TrendBand: one stacked band of the training chart. */
export type TrendBand = { label: string; color: string; values: number[] };

/** viz.TrainingTrendJSON: stacked bars per day plus a dashed "normal" line. */
export function trainingTrendOption(
	labels: string[],
	bands: TrendBand[],
	normalLabel: string,
	normal: number[]
): EChartsOption {
	const series: Record<string, unknown>[] = [];
	for (const band of bands) {
		if (!band.values.some((v) => v > 0)) continue;
		series.push({
			name: band.label,
			type: 'bar',
			stack: 'minutes',
			data: band.values,
			itemStyle: { color: band.color, borderRadius: [2, 2, 0, 0] },
			barMaxWidth: 18
		});
	}
	series.push({
		name: normalLabel,
		type: 'line',
		data: normal,
		smooth: true,
		showSymbol: false,
		lineStyle: { color: 'var(--foreground)', width: 2, type: 'dashed' },
		itemStyle: { color: 'var(--foreground)' },
		z: 3
	});
	return {
		grid: { left: 44, right: 12, top: 28, bottom: 64 },
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: { show: true, bottom: 4, itemWidth: 8, itemHeight: 8, textStyle: { color: 'var(--muted-foreground)', fontSize: 10 } },
		xAxis: {
			type: 'category',
			data: labels,
			axisLine: { lineStyle: { color: 'var(--border)' } },
			axisTick: { show: false },
			axisLabel: { color: 'var(--muted-foreground)', fontSize: 10, interval: 'auto', margin: 10 }
		},
		yAxis: {
			type: 'value',
			name: 'minutes',
			nameTextStyle: { color: 'var(--muted-foreground)', fontSize: 10, align: 'left' },
			axisLabel: { color: 'var(--muted-foreground)', fontSize: 10 },
			splitLine: { lineStyle: { color: 'var(--border)', opacity: 0.4 } }
		},
		series
	};
}
