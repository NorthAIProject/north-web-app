<!--
	Everything the range selector changes (Go DashboardPanels): the briefing,
	open coach notes, the three things to act on, the period's trends, then the
	charts. Things to act on come before things to read.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import EChart from '#lib/components/khepri/EChart.svelte';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import Markdown from '#lib/components/khepri/Markdown.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import Trends from '#lib/features/day/Trends.svelte';
	import LighterDayCard from '#lib/features/lighterday/LighterDayCard.svelte';
	import NewsTicker from '#lib/features/news/NewsTicker.svelte';
	import NudgeCard from '#lib/features/nudges/NudgeCard.svelte';
	import QuotaPanel from '#lib/features/quota/QuotaPanel.svelte';
	import type { QuotaRefusal } from '#lib/features/quota/quota.js';
	import { donutOption, gaugeOption, heatmapOption } from '#lib/features/viz/echarts.js';
	import { useI18n } from '#lib/i18n/index.js';
	import HydrationChart from './HydrationChart.svelte';
	import { iconFor } from './icons.js';
	import MoodEnergyChart from './MoodEnergyChart.svelte';
	import ReflectForm from './ReflectForm.svelte';
	import {
		caloriesKPI,
		checkInsHaveData,
		completedLine,
		formatLitres,
		formatPct,
		goalActivityLabel,
		goalProgress,
		habitsDescription,
		hydrationDescription,
		hydrationHasData,
		rangeLabel,
		relativeTime,
		sleepKPI,
		streakKPI,
		threadTitle,
		waterKPI,
		type Delta,
		type Overview
	} from './overview.js';

	let {
		overview,
		timezone,
		now,
		quota = null
	}: { overview: Overview; timezone?: string; now: Date; quota?: QuotaRefusal | null } = $props();

	const i18n = useI18n();
	const s = $derived(overview.snapshot);
	const label = $derived(rangeLabel(i18n, s.range));

	// The kind donut is built from the feed already on the page (Go buildKindDonut).
	const donut = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const e of s.timeline) counts.set(e.label, (counts.get(e.label) ?? 0) + 1);
		return donutOption([...counts].map(([l, value]) => ({ label: l, value })));
	});
	const heatmap = $derived(
		heatmapOption(
			i18n.t('dash.mood.series'),
			overview.checkIns.map((d) => ({ label: d.label, value: d.mood }))
		)
	);
	const gauge = $derived(gaugeOption('Adherence', overview.habits.rate));
</script>

{#snippet panel(title: string, description: string, body: import('svelte').Snippet)}
	<Card.Root class="border-hairline bg-surface h-full">
		<Card.Header>
			<Card.Title>{title}</Card.Title>
			{#if description}
				<Card.Description>{description}</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content>
			{@render body()}
		</Card.Content>
	</Card.Root>
{/snippet}

{#snippet emptyAction(message: string, href: string, cta: string)}
	<p class="text-muted-foreground mb-4 text-sm">{message}</p>
	<Button {href} variant="outline">{cta}</Button>
{/snippet}

{#snippet deltaChip(delta: Delta)}
	{#if delta.hasPrior && delta.direction !== 0}
		<span
			class={[
				'inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums',
				delta.direction > 0 ? 'text-signal' : 'text-muted-foreground'
			]}
		>
			{#if delta.direction > 0}
				<TrendingUpIcon class="size-3" />
			{:else}
				<TrendingDownIcon class="size-3" />
			{/if}
			{formatPct(delta.pct)}
		</span>
	{/if}
{/snippet}

{#snippet kpiWithDelta(kpiLabel: string, value: string, href: string, cta: string, delta: Delta)}
	<div class="space-y-1">
		<p class="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">{kpiLabel}</p>
		<div class="flex items-baseline gap-2">
			<p class="text-lg font-medium tabular-nums">{value}</p>
			{@render deltaChip(delta)}
		</div>
		<a {href} class="text-signal text-xs hover:underline">{cta}</a>
	</div>
{/snippet}

<div class="space-y-6">
	{#if s.briefing}
		<Card.Root class="border-hairline bg-surface" data-testid="overview-briefing">
			<Card.Content>
				<MonoLabel text={i18n.t('dash.briefing.title')} />
				<Markdown source={s.briefing} class="prose prose-sm dark:prose-invert mt-2 max-w-none" />
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- The on-demand path: ask for today's briefing from here. -->
		<Card.Root class="border-hairline bg-surface" data-testid="overview-briefing-prompt">
			<Card.Content>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<MonoLabel text={i18n.t('dash.briefing.title')} />
						<p class="mt-1 text-sm leading-relaxed">{i18n.t('dash.briefing.empty')}</p>
					</div>
					<form method="post" action="?/briefing" use:enhance>
						<Button type="submit" size="sm" variant="outline">{i18n.t('dash.briefing.write')}</Button>
					</form>
				</div>
				{#if quota}
					<div class="mt-3"><QuotaPanel {...quota} /></div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<NudgeCard nudges={s.nudges} />

	<div class="grid gap-4 lg:grid-cols-3">
		{#snippet training()}
			{#if overview.doneToday}
				<p class="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs">
					<CircleCheckIcon class="text-signal size-3.5" />
					{completedLine(i18n, overview.doneToday)}
				</p>
			{/if}
			{#if overview.planId}
				<!-- The lighter-day offer, when this morning calls for one. -->
				<LighterDayCard />
				{#if overview.nextSession}
					<p class="text-sm font-medium">{overview.nextSession.weekday} — {overview.nextSession.focus}</p>
					<p class="text-muted-foreground mt-1 mb-3 text-sm">
						{i18n.tf('dash.today.train.count', overview.nextSession.exerciseCount)}
					</p>
				{/if}
				<Button href="/app/training/{overview.planId}" variant="outline">{i18n.t('dash.training.plan')}</Button>
			{:else}
				{@render emptyAction(i18n.t('dash.training.empty'), '/app/training', i18n.t('dash.training.build'))}
			{/if}
			<a href="/app/exercises" class="text-signal mt-4 block text-xs hover:underline">{i18n.t('dash.training.library')}</a>
		{/snippet}
		{@render panel(i18n.t('dash.training.title'), '', training)}

		{#snippet goals()}
			{#if s.goals.length === 0}
				{@render emptyAction(i18n.t('dash.goals.empty'), '/app/goals', i18n.t('dash.goals.cta'))}
			{:else}
				<ul class="space-y-3">
					{#each s.goals as g (g.id)}
						{@const pct = goalProgress(g)}
						<li>
							<a href="/app/goals/{g.id}" class="block">
								<p class="text-sm font-medium">{g.title}</p>
								{#if pct !== null}
									<div class="mt-2"><Progress value={pct} max={100} size="sm" /></div>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
				<div class="mt-4">
					<Button href="/app/goals" variant="outline" size="sm">{i18n.t('dash.goals.all')}</Button>
				</div>
			{/if}
		{/snippet}
		{@render panel(i18n.t('dash.goals.title'), goalActivityLabel(i18n, s.goalActivity7d), goals)}

		{#snippet coach()}
			{#if s.lastThread}
				<p class="mb-3 text-sm font-medium">{threadTitle(s.lastThread)}</p>
				<div class="flex flex-wrap items-center gap-2">
					<Button href="/app/chat/{s.lastThread.id}" variant="outline">{i18n.t('dash.coach.cont')}</Button>
					<ReflectForm />
				</div>
			{:else}
				<p class="text-muted-foreground mb-4 text-sm">{i18n.t('dash.coach.empty')}</p>
				<div class="flex flex-wrap items-center gap-2">
					<Button href="/app/chat" variant="outline">{i18n.t('dash.coach.start')}</Button>
					<ReflectForm />
				</div>
			{/if}
		{/snippet}
		{@render panel(i18n.t('dash.coach.title'), '', coach)}
	</div>

	<KpiStrip>
		<KpiCell
			label={i18n.t('dash.kpi.streak')}
			value={streakKPI(i18n, s.streak)}
			href="/app/check-ins"
			cta={i18n.t('dash.kpi.checkcta')}
		/>
		{@render kpiWithDelta(i18n.t('dash.kpi.water'), waterKPI(i18n, s), '/app/care', i18n.t('dash.kpi.logwater'), s.deltas.hydration)}
		{@render kpiWithDelta(i18n.t('dash.kpi.sleep'), sleepKPI(s), '/app/care', i18n.t('dash.kpi.logsleep'), s.deltas.sleepHours)}
		{@render kpiWithDelta(i18n.t('dash.kpi.burned'), caloriesKPI(s), '/app/fitness', i18n.t('dash.kpi.activity'), s.deltas.calories)}
	</KpiStrip>

	<!-- My Day's trend cards, loaded after the page: twelve weeks of readings
	     is the slowest thing here and should not hold it up. -->
	<Trends timeZone={timezone || 'UTC'} />

	<div class="grid gap-4 lg:grid-cols-3">
		<div class="lg:col-span-2">
			{#snippet mood()}
				{#if checkInsHaveData(overview)}
					<MoodEnergyChart days={overview.checkIns} />
					{#if overview.checkIns.some((d) => d.mood > 0)}
						<EChart
							id="dashboard-checkin-heatmap"
							option={heatmap}
							class="border-hairline mt-4 min-h-32 w-full rounded-md border"
						/>
					{/if}
				{:else}
					<p class="text-muted-foreground text-sm">{i18n.t('dash.mood.empty')}</p>
				{/if}
			{/snippet}
			{@render panel(i18n.t('dash.mood.title'), i18n.t('dash.mood.desc'), mood)}
		</div>
		{#snippet timeline()}
			{#if s.timeline.length === 0}
				<p class="text-muted-foreground text-sm">{i18n.t('dash.timeline.empty')}</p>
			{:else}
				<ul class="divide-border -my-2 divide-y" data-testid="overview-timeline">
					{#each s.timeline as e, i (i)}
						{@const Icon = iconFor(e.icon)}
						<li class="py-2">
							<a href={e.href || undefined} class="group flex items-start gap-3">
								<span
									class="border-hairline text-muted-foreground group-hover:text-signal mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors"
								>
									<Icon class="size-3" />
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium">{e.title}</span>
									{#if e.detail}
										<span class="text-muted-foreground block truncate text-xs">{e.detail}</span>
									{/if}
								</span>
								<span class="text-muted-foreground shrink-0 font-mono text-[10px] whitespace-nowrap tabular-nums">
									{relativeTime(i18n, e.at, now, timezone)}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		{/snippet}
		{@render panel(i18n.t('dash.timeline.title'), i18n.tf('dash.timeline.desc', label), timeline)}
	</div>

	<div class="grid gap-4 lg:grid-cols-3">
		{#snippet habits()}
			{#if overview.habits.hasHabits}
				<EChart id="dashboard-habit-gauge" option={gauge} class="min-h-48 w-full" />
				<p class="text-muted-foreground mt-2 text-xs">
					{i18n.tf('dash.habits.kept', overview.habits.kept, overview.habits.scheduled)}
					{#if overview.habits.bestStreak > 0}
						<span>· {i18n.tf('dash.habits.best', overview.habits.bestStreak)}</span>
					{/if}
				</p>
			{:else}
				<!-- Habits are not on the Today card, so this empty state keeps its own way in. -->
				<p class="text-muted-foreground mb-3 text-sm">{i18n.t('dash.habits.none')}</p>
				<a href="/app/care" class="text-signal text-xs hover:underline">{i18n.t('dash.habits.cta')}</a>
			{/if}
		{/snippet}
		{@render panel(i18n.t('dash.habits.title'), habitsDescription(i18n, overview), habits)}

		{#snippet hydration()}
			{#if hydrationHasData(overview)}
				<p class="text-signal mb-3 text-sm font-medium tabular-nums">
					{i18n.tf('dash.hydration.today', s.hydration.percent, formatLitres(i18n, s.hydration.todayML))}
				</p>
				<HydrationChart label={i18n.t('dash.hydration.series')} days={overview.hydrationDays} />
			{:else}
				<p class="text-muted-foreground mb-3 text-sm">{i18n.t('dash.hydration.none')}</p>
				<a href="/app/care" class="text-signal text-xs hover:underline">{i18n.t('dash.hydration.cta')}</a>
			{/if}
		{/snippet}
		{@render panel(i18n.t('dash.hydration.title'), hydrationDescription(i18n, overview), hydration)}

		{#snippet split()}
			{#if s.timeline.length > 0}
				<EChart id="dashboard-split" option={donut} class="min-h-48 w-full" />
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('dash.timeline.empty')}</p>
			{/if}
		{/snippet}
		{@render panel(i18n.t('dash.activity.title'), i18n.t('dash.activity.desc'), split)}
	</div>

	{#if overview.newsTickerEnabled}
		<NewsTicker />
	{/if}
</div>
