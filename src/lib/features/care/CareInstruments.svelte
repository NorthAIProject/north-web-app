<!-- The KPI strip and the three instrument cards (Go: kpiStrip, instrumentsRow). -->
<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import EChart from '#lib/components/khepri/EChart.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { bar, singleLine } from '#lib/features/viz/chartjs.js';
	import { gaugeOption } from '#lib/features/viz/echarts.js';
	import { litres, sleepDuration, type Care } from './format.js';

	let { care }: { care: Care } = $props();
	const i18n = useI18n();

	// Snapshot.HasHydrationChart / HasSleepChart / HasHabits.
	const hasHydration = $derived(care.waterWeek.some((p) => p.value > 0) || care.water.totalMl > 0);
	const hasSleep = $derived(care.sleepWeek.some((p) => p.value > 0) || care.lastNight !== undefined);
	const hasHabits = $derived(care.habits.length > 0);
	const dueCount = $derived(care.reminders.filter((r) => r.due).length);
</script>

<KpiStrip>
	<KpiCell
		label={i18n.t('care.kpi.water')}
		value="{litres(i18n, care.water.totalMl)} / {litres(i18n, care.water.targetMl)}"
	/>
	<KpiCell
		label={i18n.t('care.kpi.sleep')}
		value={care.lastNight ? sleepDuration(care.lastNight.durationMinutes) : '—'}
	/>
	<KpiCell label={i18n.t('care.kpi.habits')} value={hasHabits ? `${care.habitRate}%` : '—'} />
	<KpiCell label={i18n.t('care.kpi.due')} value={dueCount === 0 ? i18n.t('care.kpi.none') : String(dueCount)} />
	<KpiCell
		label={i18n.t('care.kpi.checkin')}
		value={i18n.t(care.checkedInToday ? 'care.kpi.done' : 'care.kpi.pending')}
		href="/app/check-ins"
		cta={i18n.t(care.checkedInToday ? 'care.kpi.edit' : 'care.kpi.checkcta')}
	/>
</KpiStrip>

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('care.inst.hydration')}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if hasHydration}
				<SpecChart
					{...bar(
						'care-hydration',
						'Water (ml)',
						care.waterWeek.map((p) => p.label),
						care.waterWeek.map((p) => p.value)
					)}
				/>
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('care.inst.hydration.empty')}</p>
			{/if}
		</Card.Content>
	</Card.Root>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('care.inst.sleep')}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if hasSleep}
				<SpecChart
					{...singleLine(
						'care-sleep',
						'Hours',
						care.sleepWeek.map((p) => p.label),
						care.sleepWeek.map((p) => p.value)
					)}
				/>
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('care.inst.sleep.empty')}</p>
			{/if}
		</Card.Content>
	</Card.Root>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('care.inst.habits')}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if hasHabits}
				<EChart id="care-habit-gauge" option={gaugeOption('Adherence', care.habitRate)} class="min-h-40 w-full" />
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('care.inst.habits.empty')}</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
