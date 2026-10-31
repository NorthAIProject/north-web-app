<!-- north-client web/insights/mind.templ MindPanels: mood and energy, the mood heatmap, journalling. -->
<script lang="ts">
	import EChart from '#lib/components/khepri/EChart.svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar, moodEnergyLine } from '#lib/features/viz/chartjs.js';
	import { heatmapOption } from '#lib/features/viz/echarts.js';
	import PanelEmpty from '../PanelEmpty.svelte';
	import StatRow from '../StatRow.svelte';
	import { formatScore } from '../format.js';
	import { formatCount, type MindView } from '../domains.js';

	let { view }: { view: MindView } = $props();

	const i18n = useI18n();

	// Go buildMindView: the heatmap reads the same buckets as the lines.
	const heatmap = $derived(
		heatmapOption(
			i18n.t('insights.mind.chart.mood'),
			view.labels.map((label, i) => ({ label, value: view.mood[i] ?? 0 }))
		)
	);
</script>

<div class="space-y-6">
	<StatRow
		items={[
			{
				label: i18n.t('insights.mind.checkins'),
				value: formatCount(view.checkInCount),
				note: i18n.t('insights.mind.checkins.note')
			},
			{ label: i18n.t('insights.mind.mood'), value: formatScore(i18n, view.avgMood), note: i18n.t('insights.mind.overDays') },
			{
				label: i18n.t('insights.mind.energy'),
				value: formatScore(i18n, view.avgEnergy),
				note: i18n.t('insights.mind.overDays')
			},
			{ label: i18n.t('insights.mind.journal'), value: formatCount(view.journalCount) }
		]}
	/>
	<Card class="border-hairline bg-surface">
		<CardHeader>
			<CardTitle>{i18n.t('insights.mind.moodEnergy')}</CardTitle>
			<CardDescription>{i18n.t('insights.mind.moodEnergy.desc')}</CardDescription>
		</CardHeader>
		<CardContent>
			{#if view.hasCheckIns}
				<!-- Go names the two series "Mood" and "Energy" in English (viz.MoodEnergyLine). -->
				<SpecChart {...moodEnergyLine('insights-mind-mood', view.labels, view.mood, view.energy)} />
				<EChart
					id="insights-mind-heatmap"
					option={heatmap}
					class="border-hairline mt-4 min-h-32 w-full rounded-md border"
				/>
			{:else}
				<PanelEmpty
					message={i18n.t('insights.mind.moodEnergy.empty')}
					cta={i18n.t('insights.mind.moodEnergy.cta')}
					href="/app/check-ins"
				/>
			{/if}
		</CardContent>
	</Card>
	<Card class="border-hairline bg-surface">
		<CardHeader>
			<CardTitle>{i18n.t('insights.mind.journalling')}</CardTitle>
			<CardDescription>{i18n.t('insights.mind.journalling.desc')}</CardDescription>
		</CardHeader>
		<CardContent>
			{#if view.hasJournal}
				<SpecChart
					{...bar(
						'insights-mind-journal',
						view.journal.series[0]?.label ?? i18n.t('insights.mind.chart.entries'),
						view.journal.labels,
						view.journal.series[0]?.values ?? []
					)}
				/>
			{:else}
				<PanelEmpty
					message={i18n.t('insights.mind.journalling.empty')}
					cta={i18n.t('insights.mind.journalling.cta')}
					href="/app/mind"
				/>
			{/if}
		</CardContent>
	</Card>
</div>
