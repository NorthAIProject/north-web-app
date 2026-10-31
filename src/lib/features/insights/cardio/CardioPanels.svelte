<!-- north-client web/insights/stats.templ CardioPanels. -->
<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar } from '#lib/features/viz/chartjs.js';
	import StatRow from '../StatRow.svelte';
	import BarsCard from '../stats/BarsCard.svelte';
	import RowsCard from '../stats/RowsCard.svelte';
	import StatsEmpty from '../stats/StatsEmpty.svelte';
	import type { CardioView } from '../stats/types.js';

	let { view }: { view: CardioView } = $props();
	const i18n = useI18n();
	const weekly = $derived(view.weekly.series[0]);
</script>

{#if !view.hasData && view.heart.length === 0}
	<StatsEmpty message={i18n.t('insights.cardio.empty')} />
{:else}
	<div class="space-y-6" data-testid="insights-cardio">
		<div class="grid gap-4 lg:grid-cols-3">
			<Card class="border-hairline bg-surface lg:col-span-2">
				<CardHeader>
					<CardTitle>{view.weeklyTitle}</CardTitle>
				</CardHeader>
				<CardContent>
					<SpecChart
						{...bar('insights-cardio-weekly', weekly?.label ?? '', view.weekly.labels, weekly?.values ?? [])}
					/>
				</CardContent>
			</Card>
			<BarsCard
				title={i18n.t('insights.cardio.kinds')}
				description={i18n.t('insights.cardio.kinds.desc')}
				bars={view.kinds}
			/>
		</div>
		<StatRow items={view.tiles} />
		<div class="grid gap-4 lg:grid-cols-3">
			{#if view.hasRuns}
				<RowsCard
					title={i18n.t('insights.cardio.running')}
					description={i18n.t('insights.cardio.running.desc')}
					rows={view.runs}
				/>
			{/if}
			{#if view.heart.length > 0}
				<RowsCard
					title={i18n.t('insights.cardio.heart')}
					description={i18n.t('insights.cardio.heart.desc')}
					rows={view.heart}
				/>
			{/if}
			{#if view.recent.length > 0}
				<RowsCard title={i18n.t('insights.cardio.recent')} rows={view.recent} />
			{/if}
		</div>
	</div>
{/if}
