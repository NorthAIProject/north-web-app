<!--
	north-client web/progress/progress.templ comparison: the saved
	first-versus-latest observation and the button that makes or refreshes it.
	A plain POST: the call takes a few seconds and the page it lands on is the
	whole result.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import GitCompareIcon from '@lucide/svelte/icons/git-compare';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { dateOnly, type ApiChecks, type Assist } from './view.js';

	let {
		comparison,
		canCompare,
		assist,
		error = ''
	}: { comparison: ApiChecks['comparison']; canCompare: boolean; assist: Assist; error?: string } = $props();

	const i18n = useI18n();
	let comparing = $state(false);
	const from = $derived(comparison ? dateOnly(i18n.locale, comparison.fromOn, '2 Jan 2006') : '');
	const to = $derived(comparison ? dateOnly(i18n.locale, comparison.toOn, '2 Jan 2006') : '');
</script>

<Card.Root id="progress-compare" data-testid="progress-compare">
	<Card.Header>
		<Card.Title>{i18n.t('progress.compare.title')}</Card.Title>
		<Card.Description>
			{comparison ? `${from} → ${to}` : i18n.t('progress.compare.intro')}
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#if comparison}
			<div class="space-y-2" data-testid="progress-comparison">
				<Badge variant="outline" class="h-auto whitespace-normal">
					{i18n.t('progress.compare.label')} · {i18n.t(`progress.confidence.${comparison.confidence}`)}
				</Badge>
				<p class="text-sm leading-relaxed">{comparison.summary}</p>
				{#if comparison.limits}
					<p class="text-muted-foreground text-xs">{i18n.tf('progress.compare.limits', comparison.limits)}</p>
				{/if}
				<p class="text-muted-foreground text-xs">{i18n.tf('progress.compare.by', comparison.providerLabel)}</p>
				{#if comparison.stale}
					<p class="text-muted-foreground text-xs" data-testid="progress-compare-stale">{i18n.t('progress.compare.stale')}</p>
				{/if}
			</div>
		{/if}
		{#if error}
			<Alert.Root variant="destructive" data-testid="progress-compare-error">
				<Alert.Description>{i18n.has(error) ? i18n.t(error) : error}</Alert.Description>
			</Alert.Root>
		{/if}
		{#if canCompare && assist.available}
			<form
				method="post"
				action="?/compare"
				class="space-y-2"
				use:enhance={() => {
					comparing = true;
					return async ({ update }) => {
						comparing = false;
						await update();
					};
				}}
			>
				<Button type="submit" variant="outline" size="sm" disabled={comparing} data-testid="progress-compare-button">
					<GitCompareIcon class="size-4" />
					{#if comparing}
						{i18n.t('progress.compare.working')}
					{:else if comparison}
						{i18n.t('progress.compare.again')}
					{:else}
						{i18n.t('progress.compare.button')}
					{/if}
				</Button>
				<p class="text-muted-foreground text-xs">
					{assist.own
						? i18n.tf('progress.compare.consent.own', assist.label)
						: i18n.tf('progress.compare.consent', assist.label)}
				</p>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
