// The care page's three instruments.
//
// In Go the water bars and the sleep line are Chart.js (templUI chart, built by
// viz.Bar and viz.SingleLine); this app has no Chart.js component, so they are
// drawn with ECharts in the same shape: signal-coloured bars / a smooth line,
// no legend, horizontal grid only, y from zero. The habit gauge was already
// ECharts (viz.GaugeOptionJSON) and is ported option for option.

import type { EChartsOption } from '#lib/components/khepri/echarts.js';

type Point = { label: string; value: number };

const axes = (points: Point[]) => ({
	grid: { left: 40, right: 12, top: 16, bottom: 28 },
	tooltip: { trigger: 'axis' },
	xAxis: {
		type: 'category',
		data: points.map((p) => p.label),
		axisLine: { lineStyle: { color: 'var(--border)' } },
		axisTick: { show: false },
		axisLabel: { color: 'var(--muted-foreground)', fontSize: 11 }
	},
	yAxis: {
		type: 'value',
		min: 0,
		axisLabel: { color: 'var(--muted-foreground)', fontSize: 11 },
		splitLine: { lineStyle: { color: 'var(--border)', opacity: 0.6 } }
	}
});

/** viz.Bar("care-hydration", "Water (ml)", …). */
export function hydrationOption(points: Point[]): EChartsOption {
	return {
		...axes(points),
		series: [
			{
				name: 'Water (ml)',
				type: 'bar',
				data: points.map((p) => p.value),
				itemStyle: { color: 'var(--north-signal)' }
			}
		]
	};
}

/** viz.SingleLine("care-sleep", "Hours", …). */
export function sleepOption(points: Point[]): EChartsOption {
	return {
		...axes(points),
		series: [
			{
				name: 'Hours',
				type: 'line',
				data: points.map((p) => p.value),
				smooth: 0.35,
				lineStyle: { color: 'var(--north-signal)', width: 2 },
				itemStyle: { color: 'var(--north-signal)' }
			}
		]
	};
}

function clampPercent(p: number): number {
	return Math.min(100, Math.max(0, p));
}

/** viz.GaugeOptionJSON("Adherence", rate). */
export function habitGaugeOption(rate: number): EChartsOption {
	const percent = clampPercent(rate);
	const title = 'Adherence';
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
