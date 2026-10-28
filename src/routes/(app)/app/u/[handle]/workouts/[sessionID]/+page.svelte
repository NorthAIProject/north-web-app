<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import WorkoutCard from '#lib/components/khepri/WorkoutCard.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { cardBestIn } from '#lib/components/khepri/workout-card.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { profileBase, toCardData, toCardExercise } from '#lib/features/profiles/profile.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/profiles/profile.templ WorkoutPage — one workout with every exercise.
	let { data }: PageProps = $props();
	const i18n = useI18n();
	const c = $derived(data.card);
	const setsText = (n: number) => (n === 1 ? i18n.t('workoutcard.set') : i18n.tf('workoutcard.sets', n));
	const volumeText = (kg: number) => i18n.tf('workoutcard.volume', i18n.thousands(Math.round(kg)));
</script>

<svelte:head><title>{pageTitle(c.name)}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<Button href={profileBase(data.profile.handle)} variant="ghost" size="sm">{'← ' + i18n.t('profile.back')}</Button>
	<header>
		<h1 class="text-2xl font-medium tracking-tight">{c.name}</h1>
		<p class="text-muted-foreground mt-1 text-sm">
			{data.profile.displayName} · {formatTime(i18n.locale, c.endedAt, '2 Jan 2006', data.user.timezone)}
		</p>
	</header>
	<!-- The card carries the stats row; the list below has every exercise. -->
	<WorkoutCard card={toCardData(c, true)} />
	{#if c.exercises.length > 0}
		<Card.Root class="border-hairline bg-surface">
			<Card.Content>
				<ul class="divide-hairline divide-y">
					{#each c.exercises as e, i (i)}
						{@const best = cardBestIn(i18n, toCardExercise(e))}
						<li class="flex items-center justify-between gap-3 py-3 text-sm">
							<div class="min-w-0">
								<p class="truncate font-medium">{e.name}</p>
								<p class="text-muted-foreground text-xs tabular-nums">
									{setsText(e.sets)}
									{#if e.volumeKg > 0}
										<span aria-hidden="true">{' · '}</span>
										{volumeText(e.volumeKg)}
									{/if}
									{#if best}
										<span aria-hidden="true">{' · '}</span>
										{best}
									{/if}
								</p>
							</div>
							{#if e.pr}
								<Badge variant="secondary">{i18n.t('workoutcard.pr')}</Badge>
							{/if}
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
