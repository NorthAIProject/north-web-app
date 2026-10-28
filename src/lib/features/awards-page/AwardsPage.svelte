<script lang="ts">
	// /app/awards and /app/u/{handle}/awards: one person's earned badges and,
	// for the owner, the locked ones and the month's challenge (Go: web/awards Page).
	import { pageTitle } from '#lib/brand.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import AwardCoin from './AwardCoin.svelte';
	import MonthlyCard from './MonthlyCard.svelte';
	import { progressText, type AwardView, type MonthlyChallengeView } from './awards.js';

	let {
		name,
		handle,
		self,
		earned,
		locked,
		monthly,
		timeZone
	}: {
		name: string;
		/** Empty when the owner has none. */
		handle: string;
		self: boolean;
		earned: AwardView[];
		locked: AwardView[];
		monthly?: MonthlyChallengeView;
		timeZone: string;
	} = $props();
	const i18n = useI18n();
</script>

<svelte:head><title>{pageTitle(i18n.t('awards.page.title'))}</title></svelte:head>

{#snippet section(title: string, views: AwardView[], isLocked: boolean)}
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{title}</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each views as v (v.id)}
					<li class="flex items-center gap-3" data-badge={v.id}>
						<span class="shrink-0">
							<AwardCoin award={v} size={56} locked={isLocked} />
						</span>
						<span class="min-w-0">
							<span class="block text-sm font-medium">{v.name}</span>
							<span class="text-muted-foreground block text-xs">{v.description}</span>
							{#if isLocked}
								<span class="text-muted-foreground block text-xs tabular-nums">{progressText(v)}</span>
							{:else}
								{#if v.earnedAt}
									<span class="text-muted-foreground block text-xs">
										{i18n.tf('awards.unlock.earned', formatTime(i18n.locale, v.earnedAt, '2 Jan 2006', timeZone))}
									</span>
								{/if}
								{#if v.rarity}
									<span class="text-muted-foreground block text-xs">{i18n.tf('awards.unlock.rarity', v.rarity)}</span>
								{/if}
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		</Card.Content>
	</Card.Root>
{/snippet}

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header class="space-y-1">
		<h1 class="text-2xl font-medium tracking-tight">
			{self ? i18n.t('awards.page.title') : i18n.tf('awards.page.title.other', name)}
		</h1>
		{#if handle}
			<Button href="/app/u/{handle}" variant="ghost" size="sm">{i18n.t('awards.page.back')}</Button>
		{/if}
	</header>
	{#if monthly}
		<MonthlyCard challenge={monthly} />
	{/if}
	{#if earned.length === 0 && locked.length === 0}
		<p class="text-muted-foreground text-sm">{i18n.t('awards.page.empty.other')}</p>
	{/if}
	{#if earned.length > 0}
		{@render section(i18n.t('awards.page.earned'), earned, false)}
	{/if}
	{#if locked.length > 0}
		{@render section(i18n.t('awards.page.locked'), locked, true)}
	{/if}
</div>
