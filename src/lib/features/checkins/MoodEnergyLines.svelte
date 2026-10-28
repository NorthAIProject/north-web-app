<!--
	The fourteen-day mood and energy lines (Go viz.MoodEnergyLine, a Chart.js
	line on a 1–5 axis). Drawn with shadcn-svelte's Chart (LayerChart), the
	charting the migration settled on: mood in signal, energy muted, a legend,
	y gridlines, and a gap where a day had no check-in.
-->
<script lang="ts">
	import { LineChart } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { ChartDay } from './checkins.js';

	let { id, days }: { id: string; days: ChartDay[] } = $props();

	const i18n = useI18n();
	// Zero is "no check-in that day" (Go nullableSeries): a gap, not a dip.
	const data = $derived(
		days.map((d) => ({ label: d.label, mood: d.mood > 0 ? d.mood : null, energy: d.energy > 0 ? d.energy : null }))
	);
	const xTicks = $derived(days.map((d) => d.label).filter((_, i) => (days.length - 1 - i) % 2 === 0));
	// Go labels the datasets "Mood" and "Energy"; the catalogue has them.
	const config = $derived({
		mood: { label: i18n.t('checkins.field.mood'), color: 'var(--north-signal)' },
		energy: { label: i18n.t('checkins.field.energy'), color: 'var(--muted-foreground)' }
	} satisfies Chart.ChartConfig);
</script>

<Chart.Container {id} {config} class="aspect-auto h-48 w-full">
	<LineChart
		{data}
		x="label"
		yDomain={[1, 5]}
		yNice={false}
		axis
		grid={{ x: false, y: true }}
		legend
		series={[
			{ key: 'mood', label: config.mood.label, color: config.mood.color },
			{ key: 'energy', label: config.energy.label, color: config.energy.color }
		]}
		props={{
			spline: { strokeWidth: 2 },
			yAxis: { ticks: 5 },
			// Chart.js skips labels that would collide; every other day does the same here.
			xAxis: { ticks: xTicks },
			points: { r: 3 }
		}}
		points
	>
		{#snippet tooltip()}
			<Chart.Tooltip />
		{/snippet}
	</LineChart>
</Chart.Container>
