<!--
	north-client web/insights/training.templ TrainingPanels: the plan and the
	latest workout, energy burned, session kinds, lifting, and the sessions.
-->
<script lang="ts">
	import EChart from '#lib/components/khepri/EChart.svelte';
	import RecapCard from '#lib/components/khepri/RecapCard.svelte';
	import WeekStrip from '#lib/components/khepri/WeekStrip.svelte';
	import { newRecap, newWeek } from '#lib/components/khepri/workout-summary.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart, type ChartSpec } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar } from '#lib/features/viz/chartjs.js';
	import { donutOption } from '#lib/features/viz/echarts.js';
	import PanelEmpty from '../PanelEmpty.svelte';
	import StatTile from '../StatTile.svelte';
	import { formatKcal, relativeTime } from '../format.js';
	import { formatCount, type TrainingView } from '../domains.js';
	import LiftingSection from './LiftingSection.svelte';
	import { recapInput } from './recap.js';

	let { view, now, timeZone }: { view: TrainingView; now: Date; timeZone?: string } = $props();

	const i18n = useI18n();

	const plan = $derived(view.plan);
	const week = $derived(plan ? newWeek(plan, now) : null);
	// Go PlanAdherenceView.Rate: the window's plan days done, as a percentage.
	const rate = $derived(
		plan && plan.rangePlanned > 0 ? `${Math.trunc((plan.rangeDone * 100) / plan.rangePlanned)}%` : '—'
	);
	const recap = $derived(view.recap ? newRecap(i18n, 'insights-training-recap', recapInput(view.recap)) : null);
	const timeLabel = $derived(view.sessionCount === 0 ? '—' : view.totalTime);
</script>

<div class="space-y-6">
	{#if plan || recap}
		<section class="grid gap-4 lg:grid-cols-5" data-testid="insights-plan">
			{#if plan && week}
				<Card class="border-hairline bg-surface lg:col-span-2">
					<CardHeader>
						<CardTitle>{i18n.t('insights.training.plan')}</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							<WeekStrip {week} />
							{#if plan.rangePlanned > 0}
								<div class="border-hairline border-t pt-3">
									<div class="flex items-baseline justify-between gap-2">
										<p class="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.14em]">
											{i18n.t('insights.training.plan.window')}
										</p>
										<p class="text-xl font-medium tabular-nums">{rate}</p>
									</div>
									<p class="text-muted-foreground text-xs">{plan.rangeSentence}</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/if}
			{#if recap}
				<div class={plan ? 'lg:col-span-3' : 'lg:col-span-5'}>
					<RecapCard {recap} {timeZone}>
						{#snippet chart(c)}
							<SpecChart {...(c as ChartSpec)} />
						{/snippet}
					</RecapCard>
				</div>
			{/if}
		</section>
	{/if}
	<div class="grid gap-3 sm:grid-cols-3">
		<StatTile
			label={i18n.t('insights.training.burned')}
			value={formatKcal(view.calories)}
			note={i18n.t('insights.training.burned.note')}
			delta={view.delta}
		/>
		<StatTile
			label={i18n.t('insights.training.sessions')}
			value={formatCount(view.sessionCount)}
			note={i18n.t('insights.training.sessions.note')}
		/>
		<StatTile label={i18n.t('insights.training.time')} value={timeLabel} />
	</div>
	<div class="grid gap-4 lg:grid-cols-3">
		<Card class="border-hairline bg-surface lg:col-span-2">
			<CardHeader>
				<CardTitle>{i18n.t('insights.training.energy')}</CardTitle>
				<CardDescription>{i18n.t('insights.training.energy.desc')}</CardDescription>
			</CardHeader>
			<CardContent>
				{#if view.hasSessions}
					<SpecChart
						{...bar(
							'insights-training-burn',
							view.burn.series[0]?.label ?? 'kcal',
							view.burn.labels,
							view.burn.series[0]?.values ?? []
						)}
					/>
				{:else}
					<PanelEmpty
						message={i18n.t('insights.training.empty')}
						cta={i18n.t('insights.training.cta')}
						href="/app/fitness"
					/>
				{/if}
			</CardContent>
		</Card>
		<Card class="border-hairline bg-surface">
			<CardHeader>
				<CardTitle>{i18n.t('insights.training.kinds')}</CardTitle>
			</CardHeader>
			<CardContent>
				{#if view.kinds.length > 0}
					<EChart id="insights-training-donut" option={donutOption(view.kinds)} class="min-h-48 w-full" />
				{:else}
					<PanelEmpty message={i18n.t('insights.training.kinds.empty')} />
				{/if}
			</CardContent>
		</Card>
	</div>
	<LiftingSection lifting={view.lifting} />
	<Card class="border-hairline bg-surface">
		<CardHeader>
			<CardTitle>{i18n.t('insights.training.sessions')}</CardTitle>
		</CardHeader>
		<CardContent>
			{#if view.sessions.length === 0}
				<PanelEmpty
					message={i18n.t('insights.training.empty')}
					cta={i18n.t('insights.training.cta')}
					href="/app/fitness"
				/>
			{:else}
				<ul class="divide-border -my-2 divide-y" data-testid="insights-training-sessions">
					{#each view.sessions as s, i (i)}
						<li class="flex items-baseline justify-between gap-3 py-2">
							<span class="truncate text-sm font-medium">{s.name}</span>
							<span class="text-muted-foreground shrink-0 font-mono text-[10px] whitespace-nowrap tabular-nums">
								{s.duration}
								{#if s.calories > 0}
									<span>· {formatKcal(s.calories)}</span>
								{/if}
								<span>· {relativeTime(i18n, new Date(s.at), now, timeZone)}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>
</div>
