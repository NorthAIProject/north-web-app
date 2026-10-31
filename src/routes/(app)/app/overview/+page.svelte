<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { browserApi } from '#lib/api/client.js';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import RangeTabs from '#lib/components/khepri/RangeTabs.svelte';
	import { onCheckInSaved } from '#lib/components/khepri/live.js';
	import FirstWeekCard from '#lib/features/firstweek/FirstWeekCard.svelte';
	import NextStepCard from '#lib/features/overview/NextStepCard.svelte';
	import OverviewPanels from '#lib/features/overview/OverviewPanels.svelte';
	import TodayCard from '#lib/features/overview/TodayCard.svelte';
	import { NEXT_STEP_PUSH, RANGE_KEYS, rangeHref, rangeLabel, showToday } from '#lib/features/overview/overview.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const overview = $derived(data.overview);
	const s = $derived(overview.snapshot);
	const step = $derived(s.nextStep);
	const timezone = $derived(data.user.timezone);
	const firstName = $derived(data.user.displayName.trim().split(' ')[0] || 'there');

	// Feed times are relative to when the page was drawn, as Go's were.
	const now = $derived.by(() => {
		void overview;
		return new Date();
	});

	// The live Today region (Go TodayLive, hx-trigger "checkin-saved from:body,
	// every 20s"): after a save in this tab, and every 20 s, ask whether the
	// check-ins moved, and reload only when they did.
	$effect(() => {
		const held = overview.checkInVersion;
		return onCheckInSaved(async () => {
			try {
				const { data: v } = await browserApi().GET('/overview/version');
				if (v && v.checkInVersion !== held) await invalidate('north:overview');
			} catch {
				// A failed poll leaves the card as it is; the next one tries again.
			}
		});
	});
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.overview'))}</title></svelte:head>

<!-- Top to bottom: what to do now, what the coach has to say, the things to
     act on, and only then how the period went. -->
<div class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
	<header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<MonoLabel text={i18n.t('dash.mono')} />
			<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.tf('dash.hello', firstName)}</h1>
			<p class="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
				{i18n.tf('dash.intro', rangeLabel(i18n, s.range))}
			</p>
		</div>
		<RangeTabs
			label={i18n.t('dash.range')}
			value={s.range}
			options={RANGE_KEYS.map((key) => ({ key, label: rangeLabel(i18n, key) }))}
			hrefFor={rangeHref}
			class="-mx-1"
		/>
	</header>

	{#if step && step.kind === NEXT_STEP_PUSH}
		<NextStepCard {step} />
	{/if}

	<!-- The first week's day card, while a new person's week runs. Outside the
	     live region, so a check-in refresh does not reload it. -->
	<FirstWeekCard week={data.firstWeek} />

	<div id="dashboard-today" class="space-y-6">
		{#if step && step.kind !== NEXT_STEP_PUSH}
			<NextStepCard {step} />
		{/if}
		{#if showToday(s)}
			<TodayCard {overview} {timezone} />
		{/if}
	</div>

	<div id="dashboard-panels">
		<OverviewPanels {overview} {timezone} {now} quota={form?.quota ?? null} />
	</div>
</div>
