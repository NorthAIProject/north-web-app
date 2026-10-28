<script lang="ts">
	import { enhance } from '$app/forms';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { browserApi } from '#lib/api/client.js';
	import { pageTitle } from '#lib/brand.js';
	import Markdown from '#lib/components/khepri/Markdown.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { statusLabel, type HelpfulAnswer, type ReportDetail } from '#lib/features/reports/reports.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	const timeZone = $derived(data.user.timezone || 'UTC');

	// A pending report is being written in the background. Go said "refresh in
	// a moment"; here the page asks again every 5 s until it is ready or failed.
	const queryClient = useQueryClient();
	const key = $derived(['report', data.report.id]);
	const report = createQuery(() => ({
		queryKey: key,
		queryFn: async (): Promise<ReportDetail> =>
			(await browserApi().GET('/reports/{reportID}', { params: { path: { reportID: data.report.id } } })).data!,
		initialData: data.report,
		staleTime: 0,
		refetchInterval: (q) => (q.state.data?.status === 'pending' ? 5_000 : false)
	}));
	// A fresh load (after a rating or a navigation) is the newest copy.
	$effect(() => {
		queryClient.setQueryData(['report', data.report.id], data.report);
	});
	const item = $derived(report.data ?? data.report);

	let busy = $state(false);
	const submit = () => {
		busy = true;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = false;
		};
	};
</script>

<svelte:head><title>{pageTitle(item.title)}</title></svelte:head>

{#snippet feedbackForm(answer: HelpfulAnswer, label: string)}
	<form method="post" action="?/helpful" use:enhance={submit} class="inline">
		<input type="hidden" name="answer" value={answer} />
		<Button type="submit" size="sm" variant="outline" disabled={busy}>{label}</Button>
	</form>
{/snippet}

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header class="space-y-3">
		<a
			href="/app/reports"
			class="text-muted-foreground hover:text-foreground font-mono text-[10px] uppercase tracking-[0.14em]"
		>
			← {i18n.t('nav.reports')}
		</a>
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="text-2xl font-medium tracking-tight">{item.title}</h1>
				<p class="text-muted-foreground mt-1 text-sm">{statusLabel(i18n, item, timeZone)}</p>
			</div>
			<div class="flex gap-2">
				{#if !item.archived}
					<form method="post" action="?/archive" use:enhance={submit}>
						<Button type="submit" size="sm" variant="outline" disabled={busy}>{i18n.t('reports.archive')}</Button>
					</form>
					<form method="post" action="?/regenerate" use:enhance={submit}>
						<Button type="submit" size="sm" disabled={busy}>{i18n.t('reports.regenerate')}</Button>
					</form>
				{/if}
			</div>
		</div>
	</header>
	{#if data.notice === 'cooldown'}
		<p class="text-sm">{i18n.t('reports.cooldown')}</p>
	{/if}
	{#if data.notice === 'archived'}
		<p class="text-sm">{i18n.t('reports.isarchived')}</p>
	{/if}
	{#if form && 'quota' in form && form.quota}
		<p class="text-sm" role="alert">{form.quota}</p>
	{/if}
	{#if item.status === 'pending'}
		<p class="text-muted-foreground text-sm">{i18n.t('reports.writing')}</p>
	{/if}
	{#if item.status === 'failed'}
		<p class="text-sm">{i18n.t('reports.failed')} {item.lastError ?? ''}</p>
	{/if}
	{#if item.body}
		<Markdown
			source={item.body}
			class="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed"
		/>
		<!-- Below the body: the question only means anything once it has been read. -->
		<div id="report-feedback-{item.id}" class="border-hairline flex flex-wrap items-center gap-3 border-t pt-4">
			{#if item.helpful != null}
				<span class="text-muted-foreground text-sm">
					{i18n.t(item.helpful ? 'reports.useful.yes' : 'reports.useful.no')}
				</span>
				{@render feedbackForm('clear', i18n.t('reports.undo'))}
			{:else}
				<span class="text-sm">{i18n.t('reports.useful.ask')}</span>
				{@render feedbackForm('helpful', i18n.t('chat.feedback.yes'))}
				{@render feedbackForm('unhelpful', i18n.t('chat.feedback.no'))}
			{/if}
		</div>
	{/if}
</div>
