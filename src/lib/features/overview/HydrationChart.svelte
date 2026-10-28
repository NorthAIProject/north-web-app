<!--
	Water per day (Go viz.Bar on Chart.js): signal bars from zero, no legend.
	Drawn with the shadcn Chart (LayerChart), per the playbook.
-->
<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';

	let { label, days }: { label: string; days: { label: string; totalML: number }[] } = $props();

	const config = $derived({ totalML: { label, color: 'var(--north-signal)' } } satisfies Chart.ChartConfig);
</script>

<Chart.Container config={config} class="aspect-auto h-48 min-h-48 w-full" data-testid="overview-hydration-chart">
	<BarChart
		data={days}
		x="label"
		xScale={scaleBand().padding(0.25)}
		y="totalML"
		series={[{ key: 'totalML', label, color: 'var(--north-signal)' }]}
	>
		{#snippet tooltip()}
			<Chart.Tooltip />
		{/snippet}
	</BarChart>
</Chart.Container>
