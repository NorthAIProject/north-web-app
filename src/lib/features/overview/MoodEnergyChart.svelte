<!--
	The overview's mood and energy lines. The plot (MoodEnergyPlot, LayerChart)
	loads as the box nears the viewport, so the overview's first download
	carries no chart library.
-->
<script lang="ts">
	import LazyChart from '#lib/components/khepri/LazyChart.svelte';

	let { days }: { days: { label: string; mood: number; energy: number }[] } = $props();
</script>

<LazyChart
	load={() => import('./MoodEnergyPlot.svelte')}
	props={{ days }}
	class="h-48 min-h-48 w-full"
	data-testid="overview-mood-chart"
/>
