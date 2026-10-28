<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.training-plans'))}</title></svelte:head>

<!-- A list of anchors rather than a table: every row is a link and none of it is tabular. -->
<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header class="flex items-start justify-between gap-4">
		<div>
			<MonoLabel text={i18n.t('nav.fitness')} />
			<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('nav.training-plans')}</h1>
			<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('workouts.plans.lede')}</p>
		</div>
		<div class="flex shrink-0 gap-2">
			<Button variant="ghost" size="sm" href="/app/training/import">{i18n.t('workouts.plans.import')}</Button>
			<Button variant="outline" size="sm" href="/app/training/new">{i18n.t('workouts.plans.new')}</Button>
		</div>
	</header>
	<ul class="space-y-2">
		<!-- The first row is the plan being followed: the list puts it first. -->
		{#each data.plans as p, i (p.id)}
			<li>
				<a
					href="/app/training/{p.id}"
					class="border-hairline bg-surface hover:border-signal/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3 transition-colors"
				>
					<span class="min-w-0 flex-1 text-sm font-medium">{p.name}</span>
					{#if i === 0}
						<Badge>{i18n.t('workouts.plans.following')}</Badge>
					{/if}
					<span class="text-muted-foreground shrink-0 font-mono text-[10px] uppercase tracking-[0.14em]">
						{i18n.tf('workouts.plans.row', p.weeksTotal, p.days.length)} · {formatTime(
							i18n.locale,
							p.createdAt,
							'2 Jan 2006',
							data.user.timezone
						)}
					</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
