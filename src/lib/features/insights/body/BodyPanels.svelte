<!-- north-client web/insights/body.templ BodyPanels: water, sleep and habits. -->
<script lang="ts">
	import EChart from '#lib/components/khepri/EChart.svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar, singleLine } from '#lib/features/viz/chartjs.js';
	import { gaugeOption } from '#lib/features/viz/echarts.js';
	import PanelEmpty from '../PanelEmpty.svelte';
	import StatRow from '../StatRow.svelte';
	import { formatHours, formatLitres, formatScore } from '../format.js';
	import { formatCount, type BodyView } from '../domains.js';

	let { view }: { view: BodyView } = $props();

	const i18n = useI18n();

	// Go qualityNote: what the average is an average of.
	const qualityNote = $derived(
		view.qualityCount === 0
			? i18n.t('insights.body.quality.none')
			: view.qualityCount === 1
				? i18n.t('insights.body.quality.one')
				: i18n.tf('insights.body.quality.many', view.qualityCount)
	);
</script>

<div class="space-y-6">
	<StatRow
		items={[
			{
				label: i18n.t('insights.body.water'),
				value: formatLitres(i18n, view.totalWaterML),
				note: i18n.t('insights.body.water.note')
			},
			{ label: i18n.t('insights.body.nights'), value: formatCount(view.nights) },
			{
				label: i18n.t('insights.body.avgSleep'),
				value: formatHours(view.avgSleepMinutes),
				note: i18n.t('insights.body.avgSleep.note')
			},
			{ label: i18n.t('insights.body.quality'), value: formatScore(i18n, view.avgQuality), note: qualityNote }
		]}
	/>
	<div class="grid gap-4 lg:grid-cols-2">
		<Card class="border-hairline bg-surface">
			<CardHeader>
				<CardTitle>{i18n.t('insights.body.hydration')}</CardTitle>
				<CardDescription>{i18n.t('insights.body.hydration.desc')}</CardDescription>
			</CardHeader>
			<CardContent>
				{#if view.hasWater}
					<SpecChart
						{...bar(
							'insights-body-water',
							view.water.series[0]?.label ?? i18n.t('insights.body.chart.water'),
							view.water.labels,
							view.water.series[0]?.values ?? []
						)}
					/>
				{:else}
					<PanelEmpty
						message={i18n.t('insights.body.hydration.empty')}
						cta={i18n.t('insights.body.hydration.cta')}
						href="/app/care"
					/>
				{/if}
			</CardContent>
		</Card>
		<Card class="border-hairline bg-surface">
			<CardHeader>
				<CardTitle>{i18n.t('insights.body.sleep')}</CardTitle>
				<CardDescription>{i18n.t('insights.body.sleep.desc')}</CardDescription>
			</CardHeader>
			<CardContent>
				{#if view.hasSleep}
					<SpecChart
						{...singleLine(
							'insights-body-sleep',
							view.sleep.series[0]?.label ?? i18n.t('insights.body.chart.sleep'),
							view.sleep.labels,
							view.sleep.series[0]?.values ?? []
						)}
					/>
				{:else}
					<PanelEmpty
						message={i18n.t('insights.body.sleep.empty')}
						cta={i18n.t('insights.body.sleep.cta')}
						href="/app/care"
					/>
				{/if}
			</CardContent>
		</Card>
	</div>
	<Card class="border-hairline bg-surface">
		<CardHeader>
			<CardTitle>{i18n.t('insights.body.habits')}</CardTitle>
			<CardDescription>{i18n.t('insights.body.habits.desc')}</CardDescription>
		</CardHeader>
		<CardContent>
			{#if view.hasHabits}
				<div class="grid gap-6 lg:grid-cols-3">
					<div>
						<EChart
							id="insights-habit-gauge"
							option={gaugeOption(i18n.t('insights.body.chart.adherence'), view.adherence)}
							class="min-h-48 w-full"
						/>
					</div>
					<ul class="space-y-3 lg:col-span-2">
						{#each view.habits as h, i (i)}
							<li>
								<div class="mb-1 flex items-baseline justify-between gap-3">
									<span class="truncate text-sm font-medium">{h.name}</span>
									<span class="text-muted-foreground shrink-0 text-xs tabular-nums">
										{formatCount(h.kept)}/{formatCount(h.scheduled)}
										{#if h.streak > 0}
											<span>· {i18n.tf('insights.body.habits.streak', h.streak)}</span>
										{/if}
									</span>
								</div>
								<Progress value={h.rate} max={100} size="sm" />
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<PanelEmpty
					message={i18n.t('insights.body.habits.empty')}
					cta={i18n.t('insights.body.habits.cta')}
					href="/app/care"
				/>
			{/if}
		</CardContent>
	</Card>
</div>
