<!--
	An ECharts host (north-client ui.EChartsMount + echarts-init.js). Pass the
	option object the Go side serialised into a JSONScript (viz.GaugeOptionJSON,
	HeatmapJSON, DonutOptionJSON, TrainingTrendJSON…); colours may be
	"var(--token)" strings. SSR renders the empty host with the same class, so
	layout is stable; the chart draws after hydration.

	<EChart id="training-trend" option={trend} class="h-48 w-full" />
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { mountChart, type EChartsOption, type MountedChart } from './echarts.js';

	let { id, option, class: className = '' }: { id?: string; option: EChartsOption; class?: string } = $props();

	let el: HTMLDivElement | undefined = $state();
	let mounted: MountedChart | null = null;

	$effect(() => {
		if (!el) return;
		const host = el;
		let cancelled = false;
		const initial = untrack(() => $state.snapshot(option) as EChartsOption);
		void mountChart(host, initial).then((chart) => {
			if (cancelled) chart.destroy();
			else mounted = chart;
		});
		return () => {
			cancelled = true;
			mounted?.destroy();
			mounted = null;
		};
	});

	// A new option repaints the live chart without remounting it.
	$effect(() => {
		const next = $state.snapshot(option) as EChartsOption;
		mounted?.update(next);
	});
</script>

<div {id} bind:this={el} data-echarts class={className}></div>
