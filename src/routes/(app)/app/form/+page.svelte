<script lang="ts">
	import { goto } from '$app/navigation';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import { pageTitle } from '#lib/brand.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import QuotaRefused from '#lib/features/formcheck/QuotaRefused.svelte';
	import { uploadFormCheck } from '#lib/features/formcheck/upload.js';
	import { issueCountBadge } from '#lib/features/formcheck/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	let files: FileList | undefined = $state();
	let errMsg = $state('');
	let refusedFor: number | null = $state(null);
	let submitting = $state(false);

	const when = (t: string) => formatTime(i18n.locale, t, '2 January, 15:04', data.user.timezone);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;
		submitting = true;
		errMsg = '';
		refusedFor = null;
		const result = await uploadFormCheck(files?.item(0) ?? null);
		if (result.ok) {
			await goto(`/app/form/${result.check.id}`);
			return;
		}
		submitting = false;
		if (result.refused) refusedFor = result.retryAfterSeconds;
		else errMsg = result.message;
	}
</script>

<svelte:head><title>{pageTitle(i18n.t('form.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl p-6 md:p-8">
	<header class="mb-6">
		<h1 class="text-2xl font-semibold tracking-tight">{i18n.t('form.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">
			{i18n.t('form.lede')}
		</p>
	</header>
	{#if refusedFor !== null}
		<QuotaRefused retryAfterSeconds={refusedFor} class="mb-4" />
	{:else if errMsg}
		<Alert.Root variant="destructive" class="mb-4">
			<Alert.Description>{errMsg}</Alert.Description>
		</Alert.Root>
	{/if}
	<Card.Root class="mb-8">
		<Card.Content>
			<form method="post" enctype="multipart/form-data" class="space-y-4 pt-6" onsubmit={submit}>
				<Input id="video" name="video" type="file" accept="video/mp4,video/quicktime,video/webm" required bind:files />
				<p class="text-muted-foreground text-xs">
					{i18n.t('form.upload.help')}
				</p>
				<Button type="submit" class="w-full" disabled={submitting}>
					<UploadIcon class="size-4" />
					{i18n.t('form.upload.submit')}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
	{#if data.checks.length > 0}
		<h2 class="mb-3 text-sm font-medium">{i18n.t('form.previous')}</h2>
		<div class="space-y-2">
			{#each data.checks as a (a.id)}
				<a
					href="/app/form/{a.id}"
					class="border-border hover:bg-accent flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors"
				>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">
							{a.result ? a.result.exercise : i18n.t('form.title')}
						</p>
						<p class="text-muted-foreground text-xs">{when(a.createdAt)}</p>
					</div>
					{#if a.result}
						{@const badge = issueCountBadge(i18n, a.result)}
						<Badge variant={badge.variant}>{badge.label}</Badge>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
