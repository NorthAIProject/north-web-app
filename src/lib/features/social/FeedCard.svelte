<script lang="ts">
	import Medal from '#lib/components/khepri/Medal.svelte';
	import MonthlyMedal from '#lib/components/khepri/MonthlyMedal.svelte';
	import WorkoutCard from '#lib/components/khepri/WorkoutCard.svelte';
	import type { WorkoutCardData } from '#lib/components/khepri/types.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import NameLink from './NameLink.svelte';
	import PostForm from './PostForm.svelte';
	import { ago, coinMonth, initials, kudosCount, workoutHref } from './format.js';
	import type { FeedItem } from './types.js';

	// Go: feedCard (web/social/social.templ) with awards.Feed / FeedMonthly.
	let { items, now, timeZone }: { items: FeedItem[]; now: number; timeZone?: string } = $props();
	const i18n = useI18n();
</script>

<Card.Root id="feed" class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('social.feed.title')}</Card.Title>
		<Card.Description>{i18n.t('social.feed.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if items.length === 0}
			<p class="text-sm text-muted-foreground">{i18n.t('social.feed.empty')}</p>
		{:else}
			<ul class="divide-y divide-hairline">
				{#each items as it (it.id)}
					<li class="py-3" data-feed-item>
						<div class="flex items-start gap-3">
							<Avatar.Root>
								<Avatar.Fallback>{initials(it.displayName)}</Avatar.Fallback>
							</Avatar.Root>
							<div class="min-w-0 flex-1">
								<p class="text-sm">
									<span class="font-medium">
										{#if it.mine}
											{i18n.t('social.feed.you')}
										{:else}
											<NameLink name={it.displayName} handle={it.handle} />
										{/if}
									</span>
									<span class="text-muted-foreground"
										>· {ago(i18n, it.occurredAt, now, timeZone)}</span
									>
								</p>
								{#if it.badgeId}
									<ul class="mt-1 flex flex-wrap gap-x-4 gap-y-2" data-feed-badges>
										{#each it.badges ?? [] as b (b.id)}
											<li class="flex items-center gap-2">
												<Medal badgeId={b.id} area={b.area} size={32} label={b.name} />
												<span class="text-sm">{b.name}</span>
											</li>
										{/each}
									</ul>
								{:else if it.kind === 'monthly_challenge_met' && it.monthly?.metric}
									<ul class="mt-1 flex flex-wrap gap-x-4 gap-y-2" data-feed-badges>
										<li class="flex items-center gap-2">
											<MonthlyMedal
												month={coinMonth(i18n.locale, it.monthly.month)}
												target={it.monthly.target}
												size={32}
												label={it.title}
											/>
											<span class="text-sm">{it.title}</span>
										</li>
									</ul>
								{:else}
									<p class="text-sm">{it.title}</p>
								{/if}
								{#if !it.workout && it.detail && (it.badges?.length ?? 0) < 2}
									<p class="text-xs text-muted-foreground">{it.detail}</p>
								{/if}
							</div>
							{#if it.mine}
								{#if it.kudos > 0}
									<Badge variant="secondary">{kudosCount(i18n, it.kudos)}</Badge>
								{/if}
							{:else if it.kudoed}
								<PostForm action="/app/friends?/unkudos" fields={{ id: it.id }}>
									<Button type="submit" variant="secondary" size="sm">
										{i18n.tf('social.feed.kudos.count', it.kudos)}
									</Button>
								</PostForm>
							{:else}
								<PostForm action="/app/friends?/kudos" fields={{ id: it.id }}>
									<Button type="submit" variant="outline" size="sm">
										{#if it.kudos > 0}
											{i18n.tf('social.feed.kudos.count', it.kudos)}
										{:else}
											{i18n.t('social.feed.kudos.give')}
										{/if}
									</Button>
								</PostForm>
							{/if}
						</div>
						{#if it.workout}
							<!-- Below the row, not inside its text column: the kudos button
							     takes the right side and would squeeze the card on a phone. -->
							<WorkoutCard
								card={it.workout as unknown as WorkoutCardData}
								href={workoutHref(it.handle, it.workout.sessionId)}
							/>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</Card.Content>
</Card.Root>
