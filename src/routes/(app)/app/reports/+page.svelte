<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { statusLabel, statusWord } from '#lib/features/reports/reports.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	const timeZone = $derived(data.user.timezone || 'UTC');
	let generating = $state(false);

	const submit = () => {
		generating = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			generating = false;
		};
	};
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.reports'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header class="flex items-start justify-between gap-4">
		<div>
			<MonoLabel text={i18n.t('reports.mono')} />
			<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('reports.h1')}</h1>
			<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('reports.lede')}</p>
		</div>
		<form method="post" action="?/generate" use:enhance={submit}>
			<Button type="submit" size="sm" disabled={generating}>{i18n.t('reports.generate')}</Button>
		</form>
	</header>
	{#if data.notice === 'cooldown'}
		<p class="text-sm">{i18n.t('reports.cooldown.long')}</p>
	{/if}
	{#if form?.quota}
		<p class="text-sm" role="alert">{form.quota}</p>
	{/if}
	<div class="text-muted-foreground flex gap-4 text-xs">
		{#if data.archived}
			<a href="/app/reports" class="hover:text-foreground">{i18n.t('reports.current')}</a>
			<span class="text-foreground">{i18n.t('reports.archived')}</span>
		{:else}
			<span class="text-foreground">{i18n.t('reports.current')}</span>
			<a href="/app/reports?archived=1" class="hover:text-foreground">{i18n.t('reports.archived')}</a>
		{/if}
	</div>
	{#if data.reports.length === 0}
		<EmptyState
			eyebrow={i18n.t('reports.mono')}
			title={i18n.t('reports.empty.title')}
			body={i18n.t('reports.empty.body')}
		>
			<form method="post" action="?/generate" use:enhance={submit}>
				<Button type="submit" class="bg-signal text-background hover:bg-signal/90" disabled={generating}>
					{i18n.t('reports.generate')}
				</Button>
			</form>
		</EmptyState>
	{:else}
		<div class="space-y-3">
			{#each data.reports as report (report.id)}
				<a href="/app/reports/{report.id}" class="block" data-report-row={report.id}>
					<Card.Root>
						<Card.Content>
							<div class="flex items-baseline justify-between gap-4 pt-4">
								<div>
									<p class="text-sm font-medium">{report.title}</p>
									<p class="text-muted-foreground mt-1 text-xs">{statusLabel(i18n, report, timeZone)}</p>
								</div>
								<span class="text-muted-foreground font-mono text-[10px] uppercase tracking-wide">
									{statusWord(i18n, report.status)}
								</span>
							</div>
						</Card.Content>
					</Card.Root>
				</a>
			{/each}
		</div>
	{/if}
</div>
