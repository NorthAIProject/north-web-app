<!--
	The fourteen-day mood and energy chart. LayerChart is loaded after
	hydration: it cannot be imported during SSR in this app yet (Node refuses
	its .svelte files; layerchart needs ssr.noExternal in vite.config). SSR
	renders the empty box at the chart's size, as Go's chart.Chart does
	before chart.js draws, so the layout does not move.
-->
<script lang="ts">
	import type { Component } from 'svelte';
	import type { ChartDay } from './checkins.js';

	let { id, days }: { id: string; days: ChartDay[] } = $props();

	let Lines = $state<Component<{ id: string; days: ChartDay[] }> | null>(null);

	$effect(() => {
		let cancelled = false;
		void import('./MoodEnergyLines.svelte').then((m) => {
			if (!cancelled) Lines = m.default;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="min-h-48 w-full" data-mood-energy-chart>
	{#if Lines}
		<Lines {id} {days} />
	{/if}
</div>
