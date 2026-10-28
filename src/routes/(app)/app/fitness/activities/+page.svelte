<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page as appPage } from '$app/state';
	import { pageTitle } from '#lib/brand.js';
	import EChart from '#lib/components/khepri/EChart.svelte';
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { browserApi } from '#lib/api/client.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import ActivitySessions from '#lib/features/fitness/ActivitySessions.svelte';
	import {
		humanMinutes,
		sessionsPageURL,
		streakSentence,
		trendChartOption,
		trendSentence,
		trendState,
		type SessionPage
	} from '#lib/features/fitness/activities.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/fitness/activities.templ (ActivitiesPage). The calendar terrain
	// it once carried was replaced in Go by this ECharts training chart; there
	// is no WebGL scene left to port.

	let { data }: PageProps = $props();
	const i18n = useI18n();

	const activities = $derived(data.activities);
	const view = $derived(trendState(activities));
	const trend = $derived(activities.trend);
	const timeZone = $derived(data.user.timezone || 'UTC');
	const option = $derived(trend ? trendChartOption(i18n, trend) : null);

	// A pager click swaps only the list (Go: hx-get the sessions fragment with
	// hx-push-url). The page fetched lives in shallow-routing state, so Back
	// restores the previous list without a reload.
	const shown = $derived(
		((appPage.state as { sessions?: SessionPage }).sessions ?? activities.sessions) as
			SessionPage | undefined
	);
	let loading = $state(false);

	async function turn(n: number, event: MouseEvent) {
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
		event.preventDefault();
		if (loading) return;
		loading = true;
		try {
			const { data: next } = await browserApi().GET('/fitness/activities/sessions', {
				params: { query: { page: n } }
			});
			if (next) pushState(sessionsPageURL(next.page), { sessions: next });
		} catch {
			// The link is real: fall back to loading the whole page.
			location.href = sessionsPageURL(n);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.strava-activities'))}</title></svelte:head>

<div class="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<MonoLabel text="Strava" />
			<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('fitness.act.h1')}</h1>
		</div>
		<Button href="/app/fitness" variant="outline" size="sm">{i18n.t('fitness.act.back')}</Button>
	</header>
	{#if view === 'unconfigured'}
		<EmptyState
			eyebrow="Strava"
			title={i18n.t('fitness.act.unconfigured.title')}
			body={i18n.t('fitness.act.unconfigured.body')}
		/>
	{:else if view === 'disconnected'}
		<EmptyState
			eyebrow="Strava"
			title={i18n.t('fitness.act.disconnected.title')}
			body={i18n.t('fitness.act.disconnected.body')}
		>
			<Button
				href="/app/fitness/strava/connect"
				data-sveltekit-reload
				class="bg-signal text-background hover:bg-signal/90"
			>
				{i18n.t('fitness.strava.connect')}
			</Button>
		</EmptyState>
	{:else if view === 'unavailable'}
		<!-- Not "nothing imported yet": the history is unreadable, not empty. -->
		<EmptyState
			eyebrow="Strava"
			title={i18n.t('fitness.act.unavail.title')}
			body={i18n.t('fitness.act.unavail.body')}
		>
			<Button href="/app/fitness/activities" variant="outline">{i18n.t('fitness.act.retry')}</Button
			>
		</EmptyState>
	{:else if view === 'empty'}
		<EmptyState
			eyebrow="Strava"
			title={i18n.t('fitness.act.empty.title')}
			body={i18n.t('fitness.act.empty.body')}
		>
			<Button href="/app/fitness" variant="outline">{i18n.t('fitness.act.goto')}</Button>
		</EmptyState>
	{:else if trend}
		<KpiStrip>
			<KpiCell label={i18n.t('fitness.week.label')} value={humanMinutes(trend.recentMinutes)} />
			<KpiCell label={i18n.t('fitness.act.kpi.sessions')} value={String(trend.sessions)} />
			<KpiCell
				label={i18n.t('fitness.act.kpi.distance')}
				value="{(trend.distanceM / 1000).toFixed(0)} km"
			/>
			<KpiCell label={i18n.t('fitness.act.kpi.climb')} value="{trend.elevationM.toFixed(0)} m" />
			<KpiCell
				label={i18n.t('fitness.act.kpi.active')}
				value={i18n.tf('fitness.act.kpi.activeof', trend.activeDays, trend.countedDays)}
				href="/app/fitness"
				cta={i18n.t('fitness.act.kpi.sync')}
			/>
		</KpiStrip>
		<div class="space-y-1">
			<p class="text-base leading-relaxed">{trendSentence(i18n, trend)}</p>
			{#if streakSentence(i18n, trend)}
				<MonoLabel text={streakSentence(i18n, trend)} />
			{/if}
		</div>
		{#if option}
			<EChart id="activity-trend" {option} class="h-72 w-full sm:h-80" />
		{/if}
		{#if shown}
			<ActivitySessions page={shown} {timeZone} onPage={turn} />
		{/if}
	{/if}
</div>
