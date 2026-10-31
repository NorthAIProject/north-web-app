<!--
	The overview's mood and energy lines (Go viz.MoodEnergyLine on Chart.js):
	two series on a 1–5 axis, signal and muted, a legend, gaps where there was
	no check-in. Drawn with the shadcn Chart (LayerChart), per the playbook.
	Loaded on scroll by MoodEnergyChart.svelte.
-->
<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { LineChart, Points, Spline } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';

	let { days }: { days: { label: string; mood: number; energy: number }[] } = $props();

	// Zero is "no check-in": a gap, not a dip to the floor (Go nullableSeries).
	const rows = $derived(
		days.map((d) => ({
			label: d.label,
			mood: d.mood > 0 ? d.mood : null,
			energy: d.energy > 0 ? d.energy : null
		}))
	);

	// Go labels the two datasets in English; kept.
	const config = {
		mood: { label: 'Mood', color: 'var(--north-signal)' },
		energy: { label: 'Energy', color: 'var(--muted-foreground)' }
	} satisfies Chart.ChartConfig;
</script>

<Chart.Container {config} class="aspect-auto h-48 min-h-48 w-full">
	<LineChart
		data={rows}
		x="label"
		xScale={scaleBand()}
		yDomain={[1, 5]}
		legend
		series={[
			{ key: 'mood', label: config.mood.label, color: config.mood.color },
			{ key: 'energy', label: config.energy.label, color: config.energy.color }
		]}
	>
		{#snippet marks({ context })}
			<!-- Lines with their points (Chart.js pointRadius 3), so a lone day still shows. -->
			{#each context.series.visibleSeries as s (s.key)}
				<Spline seriesKey={s.key} curve={curveMonotoneX} strokeWidth={2} />
				<Points
					seriesKey={s.key}
					r={3}
					data={rows.filter((d) => d[s.key as 'mood' | 'energy'] != null)}
					fill={s.color}
				/>
			{/each}
		{/snippet}
		{#snippet tooltip()}
			<Chart.Tooltip />
		{/snippet}
	</LineChart>
</Chart.Container>
