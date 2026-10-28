<!--
	north-client web/insights/summary.templ SummaryPanels: every domain's ring,
	the highlights, the pinned numbers and the day-by-day table.
-->
<script lang="ts">
	import type { Component } from 'svelte';
	import DropletIcon from '@lucide/svelte/icons/droplet';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import EChart from '#lib/components/khepri/EChart.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { gaugeOption } from '#lib/features/viz/echarts.js';
	import { sparkline } from '#lib/features/viz/chartjs.js';
	import DeltaChip from '../DeltaChip.svelte';
	import PanelEmpty from '../PanelEmpty.svelte';
	import { sectionIcons } from '../sections.js';
	import type { SummaryView } from './types.js';

	let { view }: { view: SummaryView } = $props();

	const i18n = useI18n();

	// Go pinnedCards: each card's icon and sparkline id, by the metric it opens.
	const pinnedMeta: Record<string, { icon: Component; chartId: string }> = {
		water: { icon: DropletIcon, chartId: 'insights-pinned-water' },
		sleep: { icon: MoonIcon, chartId: 'insights-pinned-sleep' },
		checkins: { icon: SmileIcon, chartId: 'insights-pinned-checkins' },
		sessions: { icon: DumbbellIcon, chartId: 'insights-pinned-burn' }
	};
</script>

{#if view.empty}
	<PanelEmpty message={i18n.t('insights.summary.empty')} cta={i18n.t('insights.summary.cta')} href="/app" />
{:else}
	<div class="space-y-6">
		<section class="space-y-3">
			<div class="flex items-baseline justify-between">
				<MonoLabel text={i18n.t('insights.summary.scores')} />
				{#if view.judged > 0}
					<p class="text-muted-foreground text-xs tabular-nums">
						{i18n.tf('insights.summary.onTrack', view.onTrack, view.judged)}
					</p>
				{/if}
			</div>
			<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{#each view.scores as s (s.key)}
					{@const Icon = sectionIcons[s.key]}
					<a
						href="/app/insights/{s.key}"
						class="border-hairline bg-surface/60 hover:bg-accent/40 block space-y-3 rounded-lg border p-4 transition-colors"
						data-testid="insights-score-{s.key}"
					>
						<div class="flex items-center gap-1.5">
							{#if Icon}<Icon class="text-muted-foreground size-3.5" />{/if}
							<MonoLabel text={s.label} />
						</div>
						{#if s.hasData}
							<EChart id="insights-score-{s.key}" option={gaugeOption(s.label, s.points)} class="min-h-32 w-full" />
							<p class="text-sm font-medium">{s.verdict}</p>
							<dl class="space-y-1">
								{#each s.components as c, i (i)}
									<div class="flex items-baseline justify-between gap-2 text-xs">
										<dt class="text-muted-foreground truncate">{c.label}</dt>
										{#if c.known}
											<dd class="tabular-nums">{c.earned}/{c.weight}</dd>
										{:else}
											<dd class="text-muted-foreground tabular-nums">&mdash;</dd>
										{/if}
									</div>
								{/each}
							</dl>
							{#if s.reason}
								<p class="text-muted-foreground text-xs leading-relaxed">{s.reason}</p>
							{/if}
						{:else}
							<div class="flex min-h-32 items-center justify-center">
								<p class="text-muted-foreground text-2xl font-medium tabular-nums">&mdash;</p>
							</div>
							<p class="text-muted-foreground text-xs leading-relaxed">{i18n.t('insights.summary.unscored')}</p>
						{/if}
					</a>
				{/each}
			</div>
		</section>

		{#if view.highlights.length > 0}
			<section class="space-y-3">
				<MonoLabel text={i18n.t('insights.summary.highlights')} />
				<ul class="border-hairline bg-surface/60 divide-hairline divide-y rounded-lg border">
					{#each view.highlights as line, i (i)}
						<li class="flex items-start gap-2.5 p-4">
							<SparklesIcon class="text-signal mt-0.5 size-3.5 shrink-0" />
							<p class="text-sm leading-relaxed">{line}</p>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if view.pinned.length > 0}
			<section class="space-y-3">
				<MonoLabel text={i18n.t('insights.summary.pinned')} />
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{#each view.pinned as c, i (i)}
						{@const meta = pinnedMeta[c.metricKey ?? '']}
						<a
							href={c.metricKey ? `/app/insights/metric/${c.metricKey}` : '/app/insights'}
							class="border-hairline bg-surface/60 hover:bg-accent/40 block space-y-1 rounded-lg border p-4 transition-colors"
							data-testid="insights-pinned-{c.metricKey}"
						>
							<div class="flex items-center gap-1.5">
								{#if meta}<meta.icon class="text-muted-foreground size-3.5" />{/if}
								<MonoLabel text={c.label} />
							</div>
							<div class="flex items-baseline gap-2">
								<p class="text-xl font-medium tabular-nums">{c.value}</p>
								<DeltaChip delta={c.delta} />
							</div>
							{#if c.chart}
								<SpecChart
									{...sparkline(meta?.chartId ?? `insights-pinned-${i}`, c.chart.labels, c.chart.series[0]?.values ?? [])}
								/>
							{/if}
							{#if c.note}
								<p class="text-muted-foreground text-xs">{c.note}</p>
							{/if}
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if view.days.length > 0}
			<section class="space-y-3">
				<MonoLabel text={i18n.t('insights.summary.days')} />
				<div class="border-hairline bg-surface/60 overflow-x-auto rounded-lg border">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-hairline border-b">
								<th
									scope="col"
									class="text-muted-foreground px-4 py-2 text-left font-mono text-[10px] font-normal uppercase tracking-[0.14em]"
								>
									{i18n.t('insights.summary.day')}
								</th>
								{#each view.days[0].cells as c, i (i)}
									<th
										scope="col"
										class="text-muted-foreground px-4 py-2 text-right font-mono text-[10px] font-normal uppercase tracking-[0.14em]"
									>
										{c.label}
									</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-hairline divide-y">
							{#each view.days as d, i (i)}
								<tr>
									<th scope="row" class="text-muted-foreground px-4 py-2 text-left font-normal whitespace-nowrap">{d.label}</th>
									{#each d.cells as c, j (j)}
										<td class="px-4 py-2 text-right tabular-nums">
											{#if c.filled}
												<span class="text-foreground">{c.value}</span>
											{:else}
												<span class="text-muted-foreground/50">&mdash;</span>
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}
	</div>
{/if}
