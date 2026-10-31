<!-- north-client web/insights/metric.templ MetricBody: one metric's page. -->
<script lang="ts">
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar } from '#lib/features/viz/chartjs.js';
	import Highlights from '../Highlights.svelte';
	import PanelEmpty from '../PanelEmpty.svelte';
	import type { MetricView } from './types.js';

	let { view }: { view: MetricView } = $props();
	const i18n = useI18n();
	const series = $derived(view.chart.series[0]);
</script>

{#snippet comparisonBar(label: string, value: string, pct: number, current: boolean)}
	<div class="space-y-1">
		<div class="flex items-baseline justify-between text-xs">
			<span class="text-muted-foreground">{label}</span>
			<span class="tabular-nums">{value}</span>
		</div>
		<div class="bg-accent/40 h-2 w-full overflow-hidden rounded-full">
			<div
				class={['h-full rounded-full', current && 'bg-signal', !current && 'bg-muted-foreground/40']}
				style="width: {pct}%"
			></div>
		</div>
	</div>
{/snippet}

{#if !view.hasData}
	<PanelEmpty message={i18n.t('insights.metric.empty')} cta={i18n.t('insights.metric.cta')} href="/app/insights" />
{:else}
	<div class="space-y-6" data-testid="insights-metric">
		<div class="border-hairline bg-surface/60 space-y-4 rounded-lg border p-4">
			<div class="flex items-baseline justify-between gap-3">
				<div>
					<p class="text-muted-foreground text-[13px]">{view.label}</p>
					<p class="mt-1 text-3xl font-medium tabular-nums">{view.headline}</p>
					{#if view.note}
						<p class="text-muted-foreground mt-1 text-xs">{view.note}</p>
					{/if}
				</div>
				<a href={view.href} class="text-signal shrink-0 text-xs focus-visible:ring-ring inline-flex min-h-6 items-center rounded-sm outline-none hover:underline focus-visible:ring-2 pointer-coarse:min-h-11">
					{i18n.t('insights.metric.domainLink')}
				</a>
			</div>
			<SpecChart {...bar(`insights-metric-${view.key}`, series?.label ?? view.label, view.chart.labels, series?.values ?? [])} />
		</div>

		<div class="border-hairline bg-surface/60 flex items-center justify-between rounded-lg border px-4 py-3">
			<p class="text-muted-foreground text-[13px]">{i18n.t('insights.metric.trend')}</p>
			{#if view.trend.hasPrior}
				<span
					class={[
						'inline-flex items-center gap-1 text-sm font-medium',
						view.trend.direction > 0 && 'text-signal',
						view.trend.direction <= 0 && 'text-muted-foreground'
					]}
				>
					{#if view.trend.direction > 0}
						<TrendingUpIcon class="size-3.5" />
					{:else if view.trend.direction < 0}
						<TrendingDownIcon class="size-3.5" />
					{/if}
					{view.trend.word}
				</span>
			{:else}
				<span class="text-muted-foreground text-sm">{i18n.t('insights.metric.trend.none')}</span>
			{/if}
		</div>

		{#if view.usual}
			<div class="border-hairline bg-surface/60 space-y-1 rounded-lg border px-4 py-3">
				<p class="text-muted-foreground text-[13px]">{i18n.t('insights.metric.usual')}</p>
				<p class={['text-sm', view.usual.state !== 'usual' && 'text-signal']}>{view.usual.text}</p>
			</div>
		{/if}

		{#if view.comparison.hasPrior}
			<section class="space-y-3">
				<MonoLabel text={i18n.t('insights.metric.compare')} />
				<div class="border-hairline bg-surface/60 space-y-3 rounded-lg border p-4">
					{@render comparisonBar(view.comparison.currentLabel, view.comparison.currentValue, view.comparison.currentPct, true)}
					{@render comparisonBar(view.comparison.priorLabel, view.comparison.priorValue, view.comparison.priorPct, false)}
				</div>
			</section>
		{/if}

		{#if view.highlights.length > 0}
			<Highlights lines={view.highlights} />
		{/if}
	</div>
{/if}
