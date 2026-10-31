<!--
	The Overview's row of sparkline cards (web/day trends.templ Trends). Go
	loaded it with hx-get after the page, because twelve weeks of readings is
	the slowest thing there and should not hold the dashboard up; here it reads
	GET /day/trends itself, once the page is drawn, and stays empty until then.
-->
<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { createQuery } from '@tanstack/svelte-query';
	import { browserApi } from '#lib/api/client.js';
	import { useI18n } from '#lib/i18n/index.js';
	import Swatch from './Swatch.svelte';
	import { buildTrends, trendMeta, type DayTrends } from './view.js';

	let { timeZone }: { timeZone: string } = $props();
	const i18n = useI18n();

	const query = createQuery(() => ({
		queryKey: ['day', 'trends'],
		queryFn: async ({ signal }): Promise<DayTrends | null> =>
			(await browserApi().GET('/day/trends', { signal })).data ?? null
	}));
	const view = $derived(query.data ? buildTrends(i18n, query.data, timeZone) : null);
</script>

{#if query.isError}
	<p class="text-muted-foreground text-sm">{i18n.t('day.error')}</p>
{:else if view}
	<section class="space-y-3" aria-label={i18n.t('day.trends')} data-testid="trends">
		<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{i18n.t('day.trends')}</h2>
		{#if view.cards.length === 0 && view.fasts.length === 0}
			<p class="text-muted-foreground text-sm">{i18n.t('day.trends.empty')}</p>
		{/if}
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
			{#each view.cards as c (c.key)}
				<div class="border-hairline bg-surface rounded-2xl border p-4" data-testid="trend-{c.key}">
					<div class="flex items-center justify-between gap-2">
						<span class="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
							<Swatch color={c.color} />
							{i18n.t(`day.trend.${c.key}`)}
						</span>
						<span class="text-muted-foreground text-[10px] tracking-wide uppercase">{trendMeta(i18n, c)}</span>
					</div>
					<p class="mt-2 text-2xl font-semibold tabular-nums">
						{c.value}<span class="text-muted-foreground text-xs font-normal"> {c.unit}</span>
					</p>
					<svg viewBox="0 0 100 32" preserveAspectRatio="none" class="mt-2 h-10 w-full" aria-hidden="true">
						<polyline
							points={c.line}
							fill="none"
							stroke={c.color}
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							vector-effect="non-scaling-stroke"
						></polyline>
					</svg>
				</div>
			{/each}
		</div>
		{#if view.fasts.length > 0}
			<div class="border-hairline bg-surface rounded-2xl border p-4" data-testid="trend-fasts">
				<p class="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
					<Swatch color="var(--color-day-fat)" />
					{i18n.t('day.trend.fasts')}
				</p>
				<ul class="mt-3 space-y-2">
					{#each view.fasts as f, i (i)}
						<li class="grid grid-cols-[6rem_1fr_4rem] items-center gap-3 text-sm tabular-nums">
							<span class="text-muted-foreground">{f.date}</span>
							<span class="bg-day-fat/15 h-2 overflow-hidden rounded-full">
								<span class="bg-day-fat block h-full rounded-full" style:width="{Math.round(f.fraction * 100)}%"></span>
							</span>
							<!-- Met is a tick and a word for screen readers, not only a colour. -->
							<span class={['flex items-center justify-end gap-1 text-right', f.met && 'text-day-food-text']}>
								{#if f.met}
									<CheckIcon class="size-3.5 shrink-0" aria-hidden="true" />
									<span class="sr-only">{i18n.t('day.trend.fast_met')}</span>
								{/if}
								{f.hours}h
							</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>
{/if}
