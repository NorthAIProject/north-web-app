<script lang="ts">
	import { enhance } from '$app/forms';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { pageTitle } from '#lib/brand.js';
	import EChart from '#lib/components/khepri/EChart.svelte';
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import GoalFields from '#lib/features/goals/GoalFields.svelte';
	import {
		blankGoalForm,
		categoryLabel,
		deadlineLabel,
		instruments,
		isActive,
		overdue,
		progress,
		progressLabel,
		statusLabel
	} from '#lib/features/goals/goals.js';
	import { donutOption } from '#lib/features/viz/echarts.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	const timeZone = $derived(data.user.timezone || 'UTC');

	// A rejected goal keeps the form open: an error inside a collapsed form is
	// an error nobody sees (Go GoalForm.Open).
	// svelte-ignore state_referenced_locally
	let open = $state(Boolean(form?.errors));
	$effect(() => {
		if (form?.errors) open = true;
	});
	let submitting = $state(false);

	const inst = $derived(instruments(data.goals));
	const donut = $derived(
		inst.byCategory.length > 0
			? donutOption(inst.byCategory.map((c) => ({ label: categoryLabel(i18n, c.category), value: c.count })))
			: null
	);
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.goals'))}</title></svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('goals.mono')} />
		<div class="mt-2 flex items-start justify-between gap-4">
			<div>
				<h1 class="text-2xl font-medium tracking-tight">{i18n.t('nav.goals')}</h1>
				<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('goals.intro')}</p>
			</div>
			<Button size="sm" onclick={() => (open = !open)} aria-expanded={open}>
				<PlusIcon class="size-4" />
				{i18n.t('goals.new')}
			</Button>
		</div>
	</header>
	<KpiStrip>
		<KpiCell label={i18n.t('goals.kpi.active')} value={String(inst.activeCount)} />
		<KpiCell label={i18n.t('goals.kpi.progress')} value={inst.activeCount === 0 ? '—' : `${inst.avgProgress}%`} />
		<KpiCell
			label={i18n.t('goals.kpi.overdue')}
			value={data.overdueMilestones === 0 ? i18n.t('goals.kpi.none') : String(data.overdueMilestones)}
		/>
	</KpiStrip>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('goals.bycategory')}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if donut}
				<EChart id="goals-category-donut" option={donut} class="mx-auto min-h-48 w-full max-w-sm" />
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('goals.bycategory.empty')}</p>
			{/if}
		</Card.Content>
	</Card.Root>
	{#if open}
		<Card.Root>
			<Card.Content>
				<form
					method="post"
					action="?/create"
					class="space-y-4 pt-6"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update({ reset: false });
							submitting = false;
						};
					}}
				>
					<GoalFields form={form?.values ?? blankGoalForm()} errors={form?.errors ?? {}} />
					<Button type="submit" class="w-full" disabled={submitting}>{i18n.t('goals.create')}</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
	{#if data.goals.length === 0}
		<EmptyState eyebrow={i18n.t('goals.mono')} title={i18n.t('goals.empty.title')} body={i18n.t('goals.empty.body')}>
			<Button class="bg-signal text-background hover:bg-signal/90" onclick={() => (open = true)}>
				{i18n.t('goals.add')}
			</Button>
		</EmptyState>
	{:else}
		<div class="space-y-3">
			{#each data.goals as g (g.id)}
				{@const pct = progress(g)}
				<a href="/app/goals/{g.id}" class="block" data-goal-card={g.id}>
					<Card.Root class="hover:border-muted-foreground/30 transition-colors">
						<Card.Content>
							<div class="pt-6">
								<div class="flex items-start justify-between gap-3">
									<h2 class={['font-medium', !isActive(g) && 'text-muted-foreground line-through']}>{g.title}</h2>
									{#if g.status === 'achieved'}
										<Badge variant="secondary">{i18n.t('goals.achieved')}</Badge>
									{:else if overdue(g)}
										<Badge variant="destructive">{i18n.t('goals.overdue')}</Badge>
									{:else if !isActive(g)}
										<Badge variant="outline">{statusLabel(i18n, g.status)}</Badge>
									{/if}
								</div>
								{#if g.motivation}
									<p class="text-muted-foreground mt-1 text-sm">{g.motivation}</p>
								{/if}
								<div class="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
									<span>{categoryLabel(i18n, g.category)}</span>
									<span>·</span>
									<span class={[overdue(g) && 'text-destructive']}>{deadlineLabel(i18n, g)}</span>
									{#if pct != null}
										<span>·</span>
										<span>{progressLabel(i18n, g)}</span>
									{/if}
									{#if g.latestUpdate}
										<span>·</span>
										<span>{i18n.tf('goals.lastnote', formatTime(i18n.locale, g.latestUpdate.createdAt, '2 Jan', timeZone))}</span>
									{/if}
								</div>
								{#if pct != null}
									<div class="mt-3">
										<Progress value={pct} max={100} size="sm" />
									</div>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				</a>
			{/each}
		</div>
	{/if}
</div>
