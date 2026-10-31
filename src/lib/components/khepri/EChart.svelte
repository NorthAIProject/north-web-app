<!--
	An ECharts host (north-client ui.EChartsMount + echarts-init.js). Pass the
	option object the Go side serialised into a JSONScript (viz.GaugeOptionJSON,
	HeatmapJSON, DonutOptionJSON, TrainingTrendJSON…); colours may be
	"var(--token)" strings. SSR renders the empty host with the same class, so
	layout is stable; the chart draws after hydration.

	The canvas is pixels only, so the host is an image whose name is the
	chart's data read out ("Chart. Adherence: 80%"); `label` names what it shows
	when the data alone would not.

	<EChart id="training-trend" option={trend} label={i18n.t('…')} class="h-48 w-full" />
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { describeOption, mountChart, type EChartsOption, type MountedChart } from './echarts.js';

	let {
		id,
		option,
		label,
		class: className = ''
	}: { id?: string; option: EChartsOption; label?: string; class?: string } = $props();

	const i18n = useI18n();

	const description = $derived.by(() => {
		const summary = describeOption(option, i18n.locale);
		const text = [label, summary].filter(Boolean).join('. ');
		return text ? i18n.tf('layout.chart.aria', text) : i18n.t('layout.chart.empty');
	});

	let el: HTMLDivElement | undefined = $state();
	let mounted: MountedChart | null = null;

	$effect(() => {
		if (!el) return;
		const host = el;
		let cancelled = false;
		const initial = untrack(() => $state.snapshot(option) as EChartsOption);
		void mountChart(host, initial, untrack(() => description)).then((chart) => {
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
		mounted?.update(next, description);
	});
</script>

<div {id} bind:this={el} data-echarts role="img" aria-label={description} class={className}></div>
