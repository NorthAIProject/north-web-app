<!--
	A Go chart.Props (templUI Chart.js chart) drawn with shadcn-svelte's Chart
	(LayerChart), styled the way north-client's chart.js styled Chart.js:
	series colours from CSS tokens, muted tick labels, --border grid lines, a
	legend on top, square bars, no dots until hover, a tooltip on the page
	background with a --border hairline.

	<SpecChart {...bar('insights-body-water', 'Water', labels, values)} />

	Bars and lines only: those are the only variants Go's viz builders made.
-->
<script lang="ts">
	import { curveLinear, curveMonotoneX } from 'd3-shape';
	import { AreaChart, BarChart, LineChart } from 'layerchart';
	import { cn } from '#lib/utils.js';
	import ChartContainer from './chart-container.svelte';
	import ChartTooltip from './chart-tooltip.svelte';
	import type { ChartConfig } from './chart-utils.js';
	import type { ChartSpec } from './spec-types.js';

	let {
		id,
		variant,
		data,
		showLegend = false,
		showXAxis = false,
		showYAxis = false,
		showXLabels = false,
		showYLabels = false,
		showXGrid = false,
		showYGrid = false,
		horizontal = false,
		stacked = false,
		yMin,
		yMax,
		beginAtZero = true,
		class: className = ''
	}: ChartSpec = $props();

	// One row per label, one column per dataset (s0, s1…): LayerChart's shape.
	const keys = $derived(data.datasets.map((_, i) => `s${i}`));
	const rows = $derived(
		data.labels.map((label, i) => {
			const row: Record<string, string | number | null> = { label };
			data.datasets.forEach((d, j) => (row[`s${j}`] = d.data[i] ?? null));
			return row;
		})
	);

	// A bar is painted with its fill, a line with its stroke (Chart.js).
	const colourOf = (j: number) => {
		const d = data.datasets[j];
		return (variant === 'bar' ? d.backgroundColor : d.borderColor) ?? d.backgroundColor ?? 'var(--north-signal)';
	};
	const config = $derived(
		Object.fromEntries(keys.map((k, j) => [k, { label: data.datasets[j].label, color: colourOf(j) }])) as ChartConfig
	);
	const series = $derived(keys.map((k, j) => ({ key: k, label: data.datasets[j].label, color: colourOf(j) })));

	const showX = $derived(showXLabels || showXAxis);
	const showY = $derived(showYLabels || showYAxis);
	const axis = $derived(showX && showY ? true : showX ? ('x' as const) : showY ? ('y' as const) : false);
	const grid = $derived(showXGrid || showYGrid ? { x: showXGrid, y: showYGrid } : false);
	const legend = $derived(showLegend ? { placement: 'top' as const } : false);
	// LayerChart's default padding (defaultChartPadding) reserves the legend's
	// strip at the bottom; Chart.js's legend sits on top, so it goes there.
	const padding = $derived.by(() => {
		const y = axis === true || axis === 'y';
		const x = axis === true || axis === 'x';
		return { top: (y ? 4 : 0) + (showLegend ? 32 : 0), left: y ? 20 : 0, bottom: x ? 20 : 0, right: x ? 4 : 0 };
	});

	// Chart.js: beginAtZero pins the axis at 0 unless yMin/yMax say otherwise.
	const yDomain = $derived(
		yMin !== undefined || yMax !== undefined
			? ([yMin ?? (beginAtZero ? 0 : null), yMax ?? null] as [number | null, number | null])
			: undefined
	);
	const yBaseline = $derived(beginAtZero ? 0 : null);

	const first = $derived(data.datasets[0]);
	const curve = $derived((first?.tension ?? 0) > 0 ? curveMonotoneX : curveLinear);
	const strokeWidth = $derived(first?.borderWidth || 2);
	const pointRadius = $derived(first?.pointRadius ?? 0);
	const filled = $derived(data.datasets.some((d) => d.fill));

	// Chart.js filled a `min-h-48` box; LayerChart needs a definite height
	// (its root is height:100%), so a min-height alone also becomes the height.
	const sized = $derived(
		/(^|\s)h-/.test(className) ? className : className.replace(/(^|\s)min-h-(\S+)/, '$1min-h-$2 h-$2')
	);

	// tickOcclusion is Chart.js's autoSkip: 30 daily labels thin out instead
	// of printing over each other.
	const axisProps = {
		xAxis: { tickLabelProps: { class: 'fill-muted-foreground' }, tickOcclusion: { padding: 8 } },
		yAxis: { tickLabelProps: { class: 'fill-muted-foreground' } }
	};
</script>

<ChartContainer
	{id}
	{config}
	class={cn(
		'aspect-auto',
		// Chart.js's grid and axis colour is --border, at full strength.
		'[&_.lc-grid-x-line]:stroke-border [&_.lc-grid-y-line]:stroke-border',
		sized
	)}
	data-chart-variant={variant}
>
	{#if variant === 'bar'}
		<BarChart
			data={rows}
			x={horizontal ? undefined : 'label'}
			y={horizontal ? 'label' : undefined}
			orientation={horizontal ? 'horizontal' : 'vertical'}
			{series}
			seriesLayout={stacked ? 'stack' : series.length > 1 ? 'group' : 'auto'}
			bandPadding={0.28}
			groupPadding={0.1}
			{yDomain}
			{axis}
			{grid}
			{legend}
			{padding}
			rule={false}
			props={{ ...axisProps, bars: { radius: 0, strokeWidth: 0 } }}
		>
			{#snippet tooltip()}
				<ChartTooltip />
			{/snippet}
		</BarChart>
	{:else if filled}
		<AreaChart
			data={rows}
			x="label"
			{series}
			{yDomain}
			{yBaseline}
			{axis}
			{grid}
			{legend}
			{padding}
			rule={false}
			points={pointRadius > 0 ? { r: pointRadius } : false}
			props={{
				...axisProps,
				area: { curve, fill: first?.backgroundColor, fillOpacity: 1, line: { strokeWidth } }
			}}
		>
			{#snippet tooltip()}
				<ChartTooltip />
			{/snippet}
		</AreaChart>
	{:else}
		<LineChart
			data={rows}
			x="label"
			{series}
			{yDomain}
			yNice={yDomain === undefined}
			{yBaseline}
			{axis}
			{grid}
			{legend}
			{padding}
			rule={false}
			points={pointRadius > 0 ? { r: pointRadius } : false}
			props={{ ...axisProps, spline: { curve, strokeWidth } }}
		>
			{#snippet tooltip()}
				<ChartTooltip />
			{/snippet}
		</LineChart>
	{/if}
</ChartContainer>
