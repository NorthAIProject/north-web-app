<!--
	Water per day. The bars (HydrationBars, LayerChart) load as the box nears
	the viewport, so the overview's first download carries no chart library.
-->
<script lang="ts">
	import LazyChart from '#lib/components/khepri/LazyChart.svelte';

	let { label, days }: { label: string; days: { label: string; totalML: number }[] } = $props();
</script>

<LazyChart
	load={() => import('./HydrationBars.svelte')}
	props={{ label, days }}
	class="h-48 min-h-48 w-full"
	data-testid="overview-hydration-chart"
/>
