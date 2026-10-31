<!-- north-client web/insights/progress.templ ProgressPanels: goals, their statuses, goal notes. -->
<script lang="ts">
	import EChart from '#lib/components/khepri/EChart.svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar } from '#lib/features/viz/chartjs.js';
	import { donutOption } from '#lib/features/viz/echarts.js';
	import PanelEmpty from '../PanelEmpty.svelte';
	import StatRow from '../StatRow.svelte';
	import { formatCount, type ProgressView } from '../domains.js';

	let { view }: { view: ProgressView } = $props();

	const i18n = useI18n();

	// Go percentLabel, streakLabel, openedNote, overdueNote.
	const percent = $derived(view.avgProgress <= 0 ? '—' : `${formatCount(view.avgProgress)}%`);
	const streak = $derived(
		view.streak <= 0
			? '—'
			: view.streak === 1
				? i18n.t('insights.progress.streak.one')
				: i18n.tf('insights.progress.streak.many', view.streak)
	);
	const opened = $derived(
		view.openedCount === 0
			? i18n.t('insights.progress.opened.none')
			: view.openedCount === 1
				? i18n.t('insights.progress.opened.one')
				: i18n.tf('insights.progress.opened.many', view.openedCount)
	);
	const overdueNote = $derived(view.overdue === 0 ? '' : i18n.t('insights.progress.overdue.note'));
</script>

<div class="space-y-6">
	<StatRow
		items={[
			{ label: i18n.t('insights.progress.active'), value: formatCount(view.activeCount), note: opened },
			{
				label: i18n.t('insights.progress.average'),
				value: percent,
				note: i18n.t('insights.progress.average.note')
			},
			{ label: i18n.t('insights.progress.streak'), value: streak },
			{ label: i18n.t('insights.progress.overdue'), value: formatCount(view.overdue), note: overdueNote }
		]}
	/>
	<div class="grid gap-4 lg:grid-cols-3">
		<Card class="border-hairline bg-surface lg:col-span-2">
			<CardHeader>
				<CardTitle>{i18n.t('insights.progress.goals')}</CardTitle>
			</CardHeader>
			<CardContent>
				{#if view.goals.length === 0}
					<PanelEmpty
						message={i18n.t('insights.progress.goals.empty')}
						cta={i18n.t('insights.progress.addGoal')}
						href="/app/goals"
					/>
				{:else}
					<ul class="space-y-4" data-testid="insights-progress-goals">
						{#each view.goals as g (g.id)}
							<li>
								<a href="/app/goals/{g.id}" class="block">
									<div class="mb-1 flex items-baseline justify-between gap-3">
										<span class="truncate text-sm font-medium">{g.title}</span>
										{#if g.deadline}
											<span
												class={[
													'shrink-0 text-xs whitespace-nowrap tabular-nums',
													g.overdue ? 'text-signal' : 'text-muted-foreground'
												]}
											>
												{g.deadline}
											</span>
										{/if}
									</div>
									{#if g.hasProgress}
										<Progress value={g.progress} max={100} size="sm" />
									{:else}
										<p class="text-muted-foreground text-xs">{i18n.t('insights.progress.goals.none')}</p>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
		<Card class="border-hairline bg-surface">
			<CardHeader>
				<CardTitle>{i18n.t('insights.progress.status')}</CardTitle>
			</CardHeader>
			<CardContent>
				{#if view.statuses.length > 0}
					<EChart id="insights-progress-donut" option={donutOption(view.statuses)} class="min-h-48 w-full" />
				{:else}
					<PanelEmpty
						message={i18n.t('insights.progress.status.empty')}
						cta={i18n.t('insights.progress.addGoal')}
						href="/app/goals"
					/>
				{/if}
			</CardContent>
		</Card>
	</div>
	<Card class="border-hairline bg-surface">
		<CardHeader>
			<CardTitle>{i18n.t('insights.progress.notes')}</CardTitle>
			<CardDescription>{i18n.t('insights.progress.notes.desc')}</CardDescription>
		</CardHeader>
		<CardContent>
			{#if view.hasNotes}
				<SpecChart
					{...bar(
						'insights-progress-notes',
						view.notes.series[0]?.label ?? i18n.t('insights.progress.chart.updates'),
						view.notes.labels,
						view.notes.series[0]?.values ?? []
					)}
				/>
			{:else}
				<PanelEmpty
					message={i18n.t('insights.progress.notes.empty')}
					cta={i18n.t('insights.progress.notes.cta')}
					href="/app/goals"
				/>
			{/if}
		</CardContent>
	</Card>
</div>
