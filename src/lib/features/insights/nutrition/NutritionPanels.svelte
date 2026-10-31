<!--
	north-client web/insights/nutrition.templ NutritionBody: averages against the
	goal, calories by day, the macro split, highlights, and how the user eats.
-->
<script lang="ts">
	import EChart from '#lib/components/khepri/EChart.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar } from '#lib/features/viz/chartjs.js';
	import { donutOption } from '#lib/features/viz/echarts.js';
	import Highlights from '../Highlights.svelte';
	import PanelEmpty from '../PanelEmpty.svelte';
	import StatRow from '../StatRow.svelte';
	import BarsCard from '../stats/BarsCard.svelte';
	import RowsCard from '../stats/RowsCard.svelte';
	import { formatCount, type NutritionView } from '../domains.js';

	let { view }: { view: NutritionView } = $props();

	const i18n = useI18n();

	// Go goalNote: a blank note would leave the reader unsure whether they had met anything.
	const goalNote = (goal: string) =>
		view.hasGoal ? i18n.tf('insights.nutrition.goal', goal) : i18n.t('insights.nutrition.noGoal');
</script>

{#if !view.hasData}
	<PanelEmpty
		message={i18n.t('insights.nutrition.empty')}
		cta={i18n.t('insights.nutrition.cta')}
		href="/app/nutrition"
	/>
{:else}
	<div class="space-y-6">
		<StatRow
			items={[
				{ label: i18n.t('insights.nutrition.avgDay'), value: view.avgCalories, note: goalNote(view.goalCalories) },
				{ label: i18n.t('insights.nutrition.avgProtein'), value: view.avgProtein, note: goalNote(view.goalProtein) },
				{
					label: i18n.t('insights.nutrition.days'),
					value: formatCount(view.daysLogged),
					note: i18n.t('insights.nutrition.days.note')
				},
				{
					label: i18n.t('insights.nutrition.entries'),
					value: formatCount(view.entries),
					note: i18n.t('insights.nutrition.entries.note')
				}
			]}
		/>
		<div class="grid gap-3 lg:grid-cols-3">
			<div class="border-hairline bg-surface/60 space-y-3 rounded-lg border p-4 lg:col-span-2">
				<MonoLabel text={i18n.t('insights.nutrition.calories')} />
				<SpecChart
					{...bar(
						'insights-nutrition-calories',
						view.calories.series[0]?.label ?? 'kcal',
						view.calories.labels,
						view.calories.series[0]?.values ?? []
					)}
				/>
			</div>
			{#if view.hasSplit}
				<div class="border-hairline bg-surface/60 space-y-3 rounded-lg border p-4">
					<MonoLabel text={i18n.t('insights.nutrition.split')} />
					<EChart id="insights-nutrition-split" option={donutOption(view.macros)} class="min-h-48 w-full" />
				</div>
			{/if}
		</div>
		{#if view.highlights.length > 0}
			<Highlights lines={view.highlights} />
		{/if}
		{#if view.eating.hasData}
			<section class="space-y-4" data-testid="insights-eating">
				<h2 class="text-muted-foreground text-sm font-medium">
					{i18n.t('insights.eating.title')}
				</h2>
				<StatRow items={view.eating.tiles} />
				<div class="grid gap-4 lg:grid-cols-3">
					<BarsCard
						level={3}
						title={i18n.t('insights.eating.slots')}
						description={i18n.t('insights.eating.slots.desc')}
						bars={view.eating.slots}
					/>
					<RowsCard level={3} title={i18n.t('insights.eating.foods')} rows={view.eating.foods} />
					<RowsCard level={3} title={i18n.t('insights.eating.habits')} rows={view.eating.notes} />
				</div>
			</section>
		{/if}
	</div>
{/if}
