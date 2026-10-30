<!--
	/app/daily (north-client web/dailyposts dailyposts.templ Page): today's
	post with kudos and "Ask the coach", the earlier posts, and the disclaimer.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { pageTitle } from '#lib/brand.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { anchor, draft, paragraphs, type DailyPost } from '#lib/features/dailyposts/dailyposts.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
	const today = $derived(data.feed.today);
	const earlier = $derived(data.feed.earlier ?? []);
</script>

<svelte:head><title>{pageTitle(i18n.t('daily.title'))}</title></svelte:head>

{#snippet meta(p: DailyPost)}
	<div class="flex items-center gap-2">
		<span class="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
			{formatTime(i18n.locale, `${p.date}T00:00:00Z`, 'Mon 2 Jan', 'UTC')}
		</span>
		{#if p.aiGenerated}
			<Badge variant="secondary">
				<SparklesIcon class="size-3" />
				{i18n.t('daily.ai')}
			</Badge>
		{/if}
	</div>
{/snippet}

{#snippet kudosButton(p: DailyPost)}
	<form method="post" action={p.kudoed ? '?/kudosUndo' : '?/kudos'} use:enhance>
		<input type="hidden" name="postID" value={p.id} />
		{#if p.kudoed}
			<Button type="submit" variant="secondary" size="sm" data-testid="daily-kudos">
				{i18n.tf('social.feed.kudos.count', p.kudos)}
			</Button>
		{:else}
			<Button type="submit" variant="outline" size="sm" data-testid="daily-kudos">
				{p.kudos > 0 ? i18n.tf('social.feed.kudos.count', p.kudos) : i18n.t('social.feed.kudos.give')}
			</Button>
		{/if}
	</form>
{/snippet}

<div class="mx-auto w-full max-w-2xl space-y-5 p-4 pb-28 md:p-6 md:pb-28">
	<header>
		<MonoLabel text={i18n.t('daily.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('daily.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">{i18n.t('daily.desc')}</p>
	</header>

	{#if today}
		<Card.Root id={anchor(today.id)} class="border-hairline bg-surface" data-testid="daily-today">
			<Card.Header>
				{@render meta(today)}
				<Card.Title class="text-xl">{today.title}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3 text-[15px] leading-relaxed">
				{#each paragraphs(today.body) as para, i (i)}
					<p>{para}</p>
				{/each}
			</Card.Content>
			<Card.Footer class="flex flex-wrap gap-2">
				{@render kudosButton(today)}
				<form method="post" action="/app/chat?/start">
					<input type="hidden" name="draft" value={draft(today)} />
					<Button type="submit" variant="outline" size="sm" data-testid="daily-ask">
						<MessageCircleIcon class="size-4" />
						{i18n.t('daily.ask')}
					</Button>
				</form>
			</Card.Footer>
		</Card.Root>
	{:else}
		<EmptyState mascot title={i18n.t('daily.empty')} body={i18n.t('daily.empty.body')} />
	{/if}

	{#if earlier.length > 0}
		<section class="space-y-3" aria-labelledby="daily-earlier">
			<h2 id="daily-earlier" class="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
				{i18n.t('daily.earlier')}
			</h2>
			{#each earlier as p (p.id)}
				<Card.Root id={anchor(p.id)} class="border-hairline bg-surface/60">
					<Card.Header>
						{@render meta(p)}
						<Card.Title>{p.title}</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2 text-sm leading-relaxed">
						{#each paragraphs(p.body) as para, i (i)}
							<p class="text-muted-foreground">{para}</p>
						{/each}
					</Card.Content>
					<Card.Footer>
						{@render kudosButton(p)}
					</Card.Footer>
				</Card.Root>
			{/each}
		</section>
	{/if}

	<p class="text-muted-foreground text-xs">{i18n.t('daily.disclaimer')}</p>
</div>
