<!-- north-client web/insights/stats.templ SleepPanels. -->
<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar } from '#lib/features/viz/chartjs.js';
	import BarsCard from '../stats/BarsCard.svelte';
	import RowsCard from '../stats/RowsCard.svelte';
	import StatsEmpty from '../stats/StatsEmpty.svelte';
	import StatsTiles from '../stats/StatsTiles.svelte';
	import type { SleepView } from '../stats/types.js';

	let { view }: { view: SleepView } = $props();
	const i18n = useI18n();
	const nights = $derived(view.nights.series[0]);
</script>

{#if !view.hasData}
	<StatsEmpty message={i18n.t('insights.sleep.empty')} />
{:else}
	<div class="space-y-6" data-testid="insights-sleep">
		<StatsTiles rows={view.tiles} />
		<div class="grid gap-4 lg:grid-cols-3">
			<Card class="border-hairline bg-surface lg:col-span-2">
				<CardHeader>
					<CardTitle>{i18n.t('insights.sleep.nights')}</CardTitle>
					<CardDescription>{i18n.t('insights.sleep.nights.desc')}</CardDescription>
				</CardHeader>
				<CardContent>
					<SpecChart
						{...bar('insights-sleep-nights', nights?.label ?? '', view.nights.labels, nights?.values ?? [])}
					/>
				</CardContent>
			</Card>
			<RowsCard
				title={i18n.t('insights.sleep.schedule')}
				description={i18n.t('insights.sleep.schedule.desc')}
				rows={view.schedule}
			/>
		</div>
		<div class="grid gap-4 lg:grid-cols-2">
			{#if view.stages.length > 0}
				<BarsCard
					title={i18n.t('insights.sleep.stages')}
					description={i18n.t('insights.sleep.stages.desc')}
					bars={view.stages}
				/>
			{/if}
			<RowsCard title={i18n.t('insights.sleep.extremes')} rows={view.extremes} />
		</div>
	</div>
{/if}
