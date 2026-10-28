<!--
	The self-refreshing part of the check-ins page (Go Live): history, KPIs and
	charts. The page re-loads its data when a check-in is saved in this tab and
	every 20 s to catch saves elsewhere; this only draws what it is given.
-->
<script lang="ts">
	import EChart from '#lib/components/khepri/EChart.svelte';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { heatmapOption } from '#lib/features/viz/echarts.js';
	import { useI18n } from '#lib/i18n/index.js';
	import {
		avgKPI,
		checkinLabel,
		checkInCountKPI,
		entryTimes,
		sourceLabel,
		streakKPI,
		type CheckIn,
		type Instruments
	} from './checkins.js';
	import MoodEnergyChart from './MoodEnergyChart.svelte';

	let {
		list,
		streak,
		instruments,
		timeZone
	}: { list: CheckIn[]; streak: number; instruments: Instruments; timeZone: string } = $props();

	const i18n = useI18n();
	const heatmap = $derived(
		instruments.hasData
			? heatmapOption(
					'Mood',
					instruments.days.map((d) => ({ label: d.label, value: d.mood }))
				)
			: null
	);
</script>

<div id="checkins-live" class="flex flex-col gap-8">
	{#if list.length > 0}
		<section class="space-y-3">
			<h2 class="text-sm font-medium">{i18n.t('checkins.recent')}</h2>
			{#each list as c (c.id)}
				{@const source = sourceLabel(i18n, c.source)}
				<Card.Root class="border-hairline" data-checkin-entry={c.id}>
					<Card.Content class="py-4">
						<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
							<p class="text-sm font-medium">{checkinLabel(i18n, c)}</p>
							<p class="text-muted-foreground font-mono text-[10px] tabular-nums" data-checkin-meta>
								{entryTimes(i18n, c, timeZone)}{#if source}{' '}· {source}{/if}
							</p>
						</div>
						<p class="text-muted-foreground mt-1 text-xs tabular-nums">
							{i18n.tf('checkins.meta.moodenergy', c.mood, c.energy)}
							{#if c.stress != null}
								· {i18n.tf('checkins.meta.stress', c.stress)}
							{/if}
							{#if c.sleepQuality != null}
								· {i18n.tf('checkins.meta.sleep', c.sleepQuality)}
							{/if}
						</p>
						{#if c.tags.length > 0}
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each c.tags as tag (tag)}
									<Badge variant="secondary">{tag}</Badge>
								{/each}
							</div>
						{/if}
						{#if c.relatedGoalTitle}
							<p class="text-muted-foreground mt-1 text-sm">{i18n.tf('checkins.related', c.relatedGoalTitle)}</p>
						{/if}
						{#if c.wins}
							<p class="text-muted-foreground mt-1 text-sm">Wins: {c.wins}</p>
						{/if}
						{#if c.challenges}
							<p class="text-muted-foreground mt-1 text-sm">Hard: {c.challenges}</p>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</section>
	{/if}
	<KpiStrip>
		<KpiCell
			label={i18n.t('checkins.kpi.streak')}
			value={streakKPI(i18n, streak)}
			href="/app/check-ins"
			cta={i18n.t('checkins.kpi.checkcta')}
		/>
		<KpiCell label={i18n.t('checkins.kpi.avgmood')} value={avgKPI(i18n, instruments.avgMood, instruments.count)} />
		<KpiCell label={i18n.t('checkins.kpi.avgenergy')} value={avgKPI(i18n, instruments.avgEnergy, instruments.count)} />
		<KpiCell label={i18n.t('checkins.kpi.logged')} value={checkInCountKPI(i18n, instruments.count)} />
	</KpiStrip>
	<div class="grid gap-4 lg:grid-cols-2">
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('checkins.mood.title')}</Card.Title>
				<Card.Description>{i18n.t('checkins.mood.desc')}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if instruments.hasData}
					<MoodEnergyChart id="checkins-mood-energy" days={instruments.days} />
				{:else}
					<p class="text-muted-foreground text-sm">{i18n.t('checkins.mood.empty')}</p>
				{/if}
			</Card.Content>
		</Card.Root>
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('checkins.heatmap.title')}</Card.Title>
				<Card.Description>{i18n.t('checkins.heatmap.desc')}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if heatmap}
					<EChart
						id="checkins-mood-heatmap"
						option={heatmap}
						class="border-hairline min-h-32 w-full rounded-md border"
					/>
				{:else}
					<p class="text-muted-foreground text-sm">{i18n.t('checkins.heatmap.empty')}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
