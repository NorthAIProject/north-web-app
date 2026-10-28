<!--
	A finished workout (north-client workoutsummary.RecapCard): the sentence
	first, then the four numbers, then each exercise's volume against last time.

	Build `recap` with newRecap() from workout-summary.ts. The volume chart is
	Chart.js in Go (templUI chart, viz.GroupedBar); there is no Chart.js
	component in this app yet, so the page passes one as the `chart` snippet,
	which receives the ready-made config. Without it the chart is left out.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { changeLabel, recapTitle, recapWhen } from './workout-summary.js';
	import type { ChartJsProps, RecapView } from './types.js';

	let {
		recap,
		timeZone,
		chart
	}: {
		recap: RecapView;
		/** IANA zone the start time is shown in; the runtime's zone when absent. */
		timeZone?: string;
		chart?: Snippet<[ChartJsProps]>;
	} = $props();

	const i18n = useI18n();
	const when = $derived(recapWhen(i18n, recap, timeZone));
</script>

{#snippet tile(label: string, value: string)}
	<div class="border-hairline rounded-lg border p-3">
		<dt class="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.14em]">{label}</dt>
		<dd class="mt-1 text-lg font-medium tabular-nums">{value}</dd>
	</div>
{/snippet}

<Card class="border-hairline bg-surface" data-testid="workout-recap">
	<CardHeader>
		<div class="flex items-baseline justify-between gap-3">
			<CardTitle class="text-base">{recapTitle(i18n, recap)}</CardTitle>
			{#if when}
				<span class="text-muted-foreground shrink-0 font-mono text-[10px] tabular-nums">{when}</span>
			{/if}
		</div>
		{#if recap.sentence}
			<CardDescription>{recap.sentenceLocalised || recap.sentence}</CardDescription>
		{/if}
	</CardHeader>
	<CardContent>
		<dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{@render tile(i18n.t('layout.recap.time'), recap.duration)}
			{@render tile(i18n.t('layout.recap.sets'), recap.sets)}
			{@render tile(i18n.t('layout.recap.volume'), recap.volume)}
			{@render tile(i18n.t('layout.recap.burned'), recap.calories)}
		</dl>
		{#if recap.chart && chart}
			<div class="mt-4">
				{@render chart(recap.chart)}
			</div>
		{/if}
		{#if recap.exercises.length > 0}
			<ul class="divide-border mt-3 divide-y">
				{#each recap.exercises as e, i (i)}
					<li class="flex items-baseline justify-between gap-3 py-2 text-sm">
						<span class="min-w-0 truncate font-medium">{e.name}</span>
						<span class="text-muted-foreground shrink-0 text-xs tabular-nums">
							{#if e.best}{e.best}{/if}
							{#if e.e1rm}<span>· {i18n.tf('layout.recap.est', e.e1rm)}</span>{/if}
							{#if e.hasChange && e.change > 0}
								<span class="text-signal">{changeLabel(i18n, e.change)}</span>
							{:else if e.hasChange && e.change < 0}
								<span>{changeLabel(i18n, e.change)}</span>
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</CardContent>
</Card>
