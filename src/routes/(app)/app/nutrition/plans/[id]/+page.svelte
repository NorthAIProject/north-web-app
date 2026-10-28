<!-- Go: web/nutrition/plan_detail.templ (PlanDetailPage). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import DayCard from '#lib/features/nutrition/DayCard.svelte';
	import FieldMessage from '#lib/features/nutrition/FieldMessage.svelte';
	import OverageAlert from '#lib/features/nutrition/OverageAlert.svelte';
	import PlanNotes from '#lib/features/nutrition/PlanNotes.svelte';
	import SettingsCard from '#lib/features/nutrition/SettingsCard.svelte';
	import TargetNotice from '#lib/features/nutrition/TargetNotice.svelte';
	import { advanced, errorFor, type PlanPage } from '#lib/features/nutrition/plan-page.js';
	import { freeWeekdays, modeLabel, planTypeLabel, tf, weekdayName } from '#lib/features/nutrition/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const page = $derived<PlanPage>({
		plan: data.plan,
		target: data.plan.target,
		ingredients: data.ingredients,
		planTypes: data.planTypes,
		problem: form && 'problem' in form ? form.problem : undefined,
		overage: form && 'overage' in form ? form.overage : undefined,
		openOption: data.openOption
	});
	const plan = $derived(data.plan);
	const free = $derived(freeWeekdays(plan));
	let weekday = $state('');
	const weekdayItems = $derived(free.map((wd) => ({ value: String(wd), label: weekdayName(i18n, wd) })));
</script>

<svelte:head><title>{pageTitle(plan.name)}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<div class="flex items-center justify-between gap-4">
		<a href="/app/nutrition/plans" class="text-muted-foreground hover:text-foreground text-sm">{i18n.t('nutrition.detail.back')}</a>
		<Button variant="ghost" size="sm" href="/app/nutrition/import">{i18n.t('nutrition.detail.import')}</Button>
	</div>
	<header class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-medium tracking-tight">{plan.name}</h1>
			{#if plan.description}
				<p class="text-muted-foreground mt-1 text-sm">{plan.description}</p>
			{/if}
			<div class="mt-2 flex flex-wrap gap-2">
				<Badge variant="secondary">{planTypeLabel(i18n, plan)}</Badge>
				<Badge variant="outline">{modeLabel(i18n, plan.mode)}</Badge>
			</div>
		</div>
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" variant="ghost" size="sm">{i18n.t('nutrition.detail.delete')}</Button>
		</form>
	</header>
	<TargetNotice target={page.target} />
	{#if page.overage}
		<OverageAlert overage={page.overage} />
	{/if}
	{#if plan.notes}
		<PlanNotes notes={plan.notes} title={i18n.t('nutrition.notes.title')} description={i18n.t('nutrition.notes.desc')} />
	{/if}
	<SettingsCard {page} />
	{#each plan.days as day (day.id)}
		<DayCard {page} {day} />
	{/each}
	{#if free.length > 0}
		<form method="post" action="?/addDay" class="flex items-end gap-2" use:enhance>
			{#if advanced(page)}
				<div class="w-48">
					<Select.Root type="single" name="weekday" bind:value={weekday} items={weekdayItems}>
						<Select.Trigger aria-label={i18n.t('nutrition.day.choose')}>
							<Select.Value placeholder={i18n.t('nutrition.day.choose')} />
						</Select.Trigger>
						<Select.Content>
							{#each weekdayItems as item (item.value)}
								<Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<Button type="submit" variant="outline">{i18n.t('nutrition.day.add')}</Button>
			{:else}
				<Button type="submit" variant="outline">{tf(i18n, 'nutrition.day.add.named', weekdayName(i18n, free[0]))}</Button>
			{/if}
		</form>
		<FieldMessage message={errorFor(page, 'days', 'weekday')} />
	{/if}
</div>
