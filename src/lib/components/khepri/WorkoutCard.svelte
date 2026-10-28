<!--
	A finished workout as someone else sees it (north-client workoutcard.Card):
	the stats row, the top two exercises and a chip per personal record. Never
	calories, heart rate or body numbers. The whole card links to href (the
	author's workout page); with no href it is plain.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { Card } from '#lib/components/ui/card/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { cardBestIn, cardStats, topExercises } from './workout-card.js';
	import type { WorkoutCardData } from './types.js';

	let { card, href = '' }: { card: WorkoutCardData; href?: string } = $props();

	const i18n = useI18n();
	const stats = $derived(cardStats(i18n, card));
	const top = $derived(topExercises(card));
</script>

{#snippet body()}
	<p class="text-muted-foreground text-xs">
		{#each stats as s, i (i)}
			{#if i > 0}<span aria-hidden="true">{' · '}</span>{/if}<span class="tabular-nums">{s}</span>
		{/each}
	</p>
	{#if top.length > 0}
		<ul class="mt-2 space-y-1">
			{#each top as e, i (i)}
				{@const best = cardBestIn(i18n, e)}
				<li class="flex items-center justify-between gap-2 text-sm">
					<span class="truncate">{e.name}</span>
					{#if best}
						<span class="text-muted-foreground shrink-0 tabular-nums text-xs">{best}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	{#if card.prs > 0}
		<div class="mt-2 flex flex-wrap gap-1">
			{#each card.exercises as e, i (i)}
				{#if e.pr}
					<Badge variant="secondary">{i18n.t('workoutcard.pr')} · {e.name}</Badge>
				{/if}
			{/each}
		</div>
	{/if}
{/snippet}

<Card class="border-hairline bg-surface-2 mt-2" data-testid="workout-card">
	{#if href}
		<a {href} class="block p-3">{@render body()}</a>
	{:else}
		<div class="p-3">{@render body()}</div>
	{/if}
</Card>
