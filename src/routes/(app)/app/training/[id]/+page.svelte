<script lang="ts">
	import { goto } from '$app/navigation';
	import { isApiError } from '#lib/api/errors.js';
	import { pageTitle } from '#lib/brand.js';
	import EChart from '#lib/components/khepri/EChart.svelte';
	import ReadinessCard from '#lib/components/khepri/ReadinessCard.svelte';
	import RecapCard from '#lib/components/khepri/RecapCard.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { newRecap } from '#lib/components/khepri/workout-summary.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import TodayCard from '#lib/features/lifts/TodayCard.svelte';
	import FollowCard from '#lib/features/training/FollowCard.svelte';
	import PlanBody from '#lib/features/training/PlanBody.svelte';
	import WeekSection from '#lib/features/training/WeekSection.svelte';
	import type { EditResult } from '#lib/features/training/edits.js';
	import { groupedBarOption, planURL, readinessFrom, recapFrom } from '#lib/features/training/plan.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	// The plan on screen. An edit answers with the version it stored, shown at
	// once, then the address moves to that version (Go: HX-Push-Url) so a
	// reload shows what is on screen.
	let plan = $derived(data.plan);
	let busy = $state(false);
	let editError = $state('');

	const recap = $derived(data.overview.recap ? newRecap(i18n, 'plan-recap', recapFrom(data.overview.recap)) : null);
	const readiness = $derived(data.overview.readiness ? readinessFrom(data.overview.readiness) : null);

	async function onEdit(run: () => Promise<EditResult>): Promise<boolean> {
		busy = true;
		editError = '';
		try {
			const result = await run();
			plan = result.plan;
			await goto(planURL(result.plan.id), { reset: false });
			// A superseded plan is not an error the person caused; the current
			// version is now on screen to try again against.
			return !result.superseded;
		} catch (err) {
			if (!isApiError(err) || (err.status !== 422 && err.status !== 400)) throw err;
			editError = Object.values(err.fields)[0] ?? err.message;
			return false;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{pageTitle(plan.name)}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl p-6 md:p-8">
	<header class="mb-6 flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{plan.name}</h1>
			<p class="text-muted-foreground mt-1 text-sm">
				{i18n.tf(
					'workouts.plan.meta',
					plan.weeksTotal,
					plan.days.length,
					formatTime(i18n.locale, plan.createdAt, '2 January 2006', data.user.timezone)
				)}
			</p>
		</div>
		<div class="flex shrink-0 gap-2">
			<Button variant="ghost" size="sm" href="/app/training/plans">{i18n.t('workouts.plan.all')}</Button>
			<Button variant="ghost" size="sm" href="/app/training/import">{i18n.t('workouts.plans.import')}</Button>
			<Button variant="outline" size="sm" href="/app/training/new">{i18n.t('workouts.plans.new')}</Button>
		</div>
	</header>
	{#if data.week}
		{#key data.plan.id}
			<WeekSection initialWeek={data.week} plans={data.plans} todayWeekday={data.todayWeekday} />
		{/key}
	{:else if !plan.active}
		<FollowCard planID={plan.id} />
	{/if}
	{#if recap}
		<section class="mb-6">
			<RecapCard {recap} timeZone={data.user.timezone}>
				{#snippet chart(c)}
					<EChart id={c.id} option={groupedBarOption(c)} class="h-48 w-full" />
				{/snippet}
			</RecapCard>
		</section>
	{/if}
	{#if readiness}
		<section class="mb-6">
			<ReadinessCard {readiness} timeZone={data.user.timezone} />
		</section>
	{/if}
	<TodayCard />
	<Card.Root class="mb-6">
		<Card.Header>
			<Card.Title class="text-base">{i18n.t('workouts.plan.why')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">{plan.rationale}</p>
		</Card.Content>
	</Card.Root>
	<PlanBody {plan} {busy} error={editError} {onEdit} />
</div>
