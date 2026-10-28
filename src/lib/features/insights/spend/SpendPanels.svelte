<!-- north-client web/insights/spend.templ SpendBody. -->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import PanelEmpty from '../PanelEmpty.svelte';
	import StatTile from '../StatTile.svelte';
	import { formatTokens } from './format.js';
	import type { SpendLine, SpendView } from './types.js';

	let { view }: { view: SpendView } = $props();
	const i18n = useI18n();
</script>

{#snippet spendTable(title: string, rows: SpendLine[])}
	{#if rows.length > 0}
		<section class="space-y-3">
			<MonoLabel text={title} />
			<div class="border-hairline bg-surface/60 divide-hairline divide-y rounded-lg border">
				{#each rows as r, i (i)}
					<div class="space-y-1.5 p-4">
						<div class="flex items-baseline justify-between gap-3 text-sm">
							<span class="truncate">{r.label}</span>
							<span class="shrink-0 tabular-nums">{r.cost}</span>
						</div>
						<div class="bg-accent/40 h-1.5 w-full overflow-hidden rounded-full">
							<div class="bg-signal h-full rounded-full" style="width: {r.pct}%"></div>
						</div>
						<p class="text-muted-foreground text-xs tabular-nums">
							{i18n.tf('insights.spend.row', r.generations, formatTokens(i18n, r.tokens))}
						</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}
{/snippet}

{#if !view.hasData}
	<PanelEmpty message={i18n.t('insights.spend.empty')} />
{:else}
	<div class="space-y-6" data-testid="insights-spend">
		<div class="grid gap-3 sm:grid-cols-3">
			<StatTile label={i18n.t('insights.spend.cost')} value={view.totalCost} note={i18n.t('insights.spend.cost.note')} />
			<StatTile
				label={i18n.t('insights.spend.generations')}
				value={String(view.generations)}
				note={i18n.t('insights.spend.generations.note')}
			/>
			<StatTile
				label={i18n.t('insights.spend.tokens')}
				value={formatTokens(i18n, view.totalTokens)}
				note={i18n.t('insights.spend.tokens.note')}
			/>
		</div>
		{@render spendTable(i18n.t('insights.spend.surfaces'), view.surfaces)}
		{@render spendTable(i18n.t('insights.spend.models'), view.models)}
	</div>
{/if}
