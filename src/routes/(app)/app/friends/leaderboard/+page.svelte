<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import {
		boards,
		initial,
		kindLabel,
		switchLabel,
		valueText
	} from '#lib/features/leaderboard/leaderboard.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/leaderboard/leaderboard.templ LeaderboardPage.
	let { data }: PageProps = $props();
	const i18n = useI18n();
	const s = $derived(data.summary);
	const lb = $derived(data.leaderboard);
	const next = $derived(s.level.next ?? 0);
</script>

<svelte:head><title>{pageTitle(i18n.t('leaderboard.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header class="flex items-end justify-between gap-4">
		<div>
			<MonoLabel text={i18n.t('leaderboard.mono')} />
			<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('leaderboard.title')}</h1>
			<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
				{i18n.t('leaderboard.intro')}
			</p>
		</div>
		<Button href="/app/friends" variant="ghost">{i18n.t('leaderboard.friends')}</Button>
	</header>

	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Description>{i18n.tf('leaderboard.level', s.level.number)}</Card.Description>
			<!-- The API sends the title already in the reader's language. -->
			<Card.Title>{s.level.title}</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				{#if next > 0}
					<div class="space-y-1">
						<Progress
							max={next - s.level.floor}
							value={s.total - s.level.floor}
							label={i18n.t('leaderboard.level.progress')}
						/>
						<p class="text-xs text-muted-foreground tabular-nums">
							{i18n.tf('leaderboard.level.tonext', s.total, next - s.total)}
						</p>
					</div>
				{:else}
					<p class="text-xs text-muted-foreground tabular-nums">
						{i18n.tf('leaderboard.level.top', s.total)}
					</p>
				{/if}
				<div>
					<p class="text-sm font-medium tabular-nums">
						{i18n.tf('leaderboard.week.total', s.weekTotal)}
					</p>
					<ul class="mt-2 divide-y divide-hairline">
						{#each s.earned as k (k.kind)}
							<li class="flex items-center justify-between py-2 text-sm">
								<span class="text-muted-foreground">{kindLabel(i18n, k.kind)}</span>
								<span class="tabular-nums">{`${k.count} × · ${k.points} XP`}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<nav class="flex flex-wrap gap-2" aria-label={i18n.t('leaderboard.boards')}>
				{#each boards as b (b.key)}
					{#if b.key === data.board}
						<Button href="?board={b.key}" variant="secondary" size="sm" aria-current="page"
							>{i18n.t(b.labelKey)}</Button
						>
					{:else}
						<Button href="?board={b.key}" variant="ghost" size="sm">{i18n.t(b.labelKey)}</Button>
					{/if}
				{/each}
			</nav>
		</Card.Header>
		<Card.Content>
			<ol class="divide-y divide-hairline">
				{#each lb.entries as r (r.userId)}
					<li class={['flex items-center gap-3 py-3', r.me && 'font-medium']}>
						<span class="w-6 text-right text-sm text-muted-foreground tabular-nums">{r.rank}</span>
						<Avatar.Root>
							<Avatar.Fallback>{initial(r.displayName)}</Avatar.Fallback>
						</Avatar.Root>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm">
								{#if r.handle}
									<!-- A hand-rolled inline anchor: a name inside a line of text. -->
									<a href="/app/u/{encodeURIComponent(r.handle)}" class="hover:underline"
										>{r.displayName}</a
									>
								{:else}
									{r.displayName}
								{/if}
								{#if r.me}
									<span class="font-normal text-muted-foreground">{i18n.t('leaderboard.you')}</span>
								{/if}
							</p>
							{#if r.handle}
								<p class="truncate text-xs text-muted-foreground">{'@' + r.handle}</p>
							{/if}
						</div>
						{#if r.level?.title}
							<Badge variant="outline">{r.level.title}</Badge>
						{/if}
						<span class="text-sm tabular-nums">{valueText(i18n, lb.metric, r.value)}</span>
					</li>
				{/each}
			</ol>
			{#if lb.entries.length <= 1}
				<p class="mt-3 text-sm text-muted-foreground">{i18n.t('leaderboard.alone')}</p>
			{/if}
			{#if !lb.sharing}
				<p class="mt-3 text-sm text-muted-foreground">
					{i18n.t('leaderboard.hidden.before')}
					<span class="text-foreground">{switchLabel(i18n, lb.metric)}</span>
					{i18n.t('leaderboard.hidden.under')}
					<a href="/app/friends" class="underline underline-offset-2"
						>{i18n.t('leaderboard.hidden.link')}</a
					>.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
