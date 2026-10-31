<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import ExerciseArt from '#lib/components/khepri/ExerciseArt.svelte';
	import ExerciseArtCredit from '#lib/components/khepri/ExerciseArtCredit.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import MuscleViewer from '#lib/components/khepri/MuscleViewer.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import ExerciseRow from '#lib/features/exercises/ExerciseRow.svelte';
	import {
		categoryLabel,
		dayLabel,
		difficultyLabel,
		equipmentLabel,
		muscleLabel,
		pageURL,
		weekdayName
	} from '#lib/features/exercises/vocabulary.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	const e = $derived(data.exercise);
	const illustrated = $derived(Boolean(e.illustrationSlug));
	const needsEquipment = $derived(e.equipment !== '' && e.equipment !== 'none');
	const inPlanOn = $derived(data.days.filter((d) => d.includes).map((d) => weekdayName(i18n, d.weekday)));
</script>

<svelte:head><title>{pageTitle(e.name)}</title></svelte:head>

{#snippet muscleCard(label: string, keys: string[])}
	{#if keys.length > 0}
		<div>
			<MonoLabel text={label} />
			<div class="mt-2 flex flex-wrap gap-2">
				{#each keys as key (key)}
					<Badge variant="secondary">{muscleLabel(i18n, key)}</Badge>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

<div class="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
	<header>
		<a
			href="/app/exercises"
			class="text-muted-foreground hover:text-foreground font-mono text-[10px] uppercase tracking-[0.14em]"
		>
			&larr; {i18n.t('nav.exercises')}
		</a>
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{e.name}</h1>
		<div class="mt-3 flex flex-wrap items-center gap-2">
			<Badge variant="secondary">{categoryLabel(i18n, e.category)}</Badge>
			<Badge variant="secondary">{difficultyLabel(i18n, e.difficulty)}</Badge>
			{#if needsEquipment}
				<Badge variant="secondary">{equipmentLabel(i18n, e.equipment)}</Badge>
			{/if}
		</div>
	</header>
	<div class="grid gap-6 md:grid-cols-2">
		{#key e.slug}
			<MuscleViewer
				id="exercise-{e.slug}"
				primary={e.primaryMuscles}
				secondary={e.secondaryMuscles}
				exerciseName={e.name}
			/>
		{/key}
		<div class="space-y-4">
			{#if illustrated}
				<ExerciseArt
					id="art-{e.slug}"
					slug={e.illustrationSlug ?? ''}
					name={e.name}
					class="border-hairline bg-surface rounded-lg border p-4"
				/>
			{/if}
			{@render muscleCard(i18n.t('exercises.detail.primary'), e.primaryMuscles)}
			{@render muscleCard(i18n.t('exercises.detail.secondary'), e.secondaryMuscles)}
			{#if e.videoUrl}
				<Button href={e.videoUrl} variant="outline" target="_blank">{i18n.t('exercises.detail.video')}</Button>
			{/if}
		</div>
	</div>
	{#if e.instructions}
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('exercises.detail.howto')}</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-sm leading-relaxed">{e.instructions}</p>
			</Card.Content>
		</Card.Root>
	{/if}
	<!--
		"Now what", in the reader's own terms. Each add is a plain POST to the
		training plan's edit route, so it works without JavaScript and lands on
		the plan with the exercise in it.
	-->
	<section data-exercise-next class="border-hairline bg-surface rounded-lg border p-4">
		<MonoLabel text={i18n.t('exercises.next.label')} />
		{#if !data.planId}
			<p class="mt-2 text-sm leading-relaxed">{i18n.t('exercises.next.noplan')}</p>
			<div class="mt-3">
				<Button href="/app/training">{i18n.t('exercises.next.build')}</Button>
			</div>
		{:else}
			{#if inPlanOn.length > 0}
				<p class="mt-2 text-sm leading-relaxed">{i18n.tf('exercises.next.inplan', inPlanOn.join(', '))}</p>
				<div class="mt-3">
					<Button href="/app/training/{data.planId}"
						>{i18n.t('exercises.next.open')}</Button
					>
				</div>
			{:else}
				<p class="mt-2 text-sm leading-relaxed">{i18n.t('exercises.next.add')}</p>
			{/if}
			<ul class="mt-3 flex flex-wrap gap-2">
				{#each data.days as day (day.index)}
					{#if !day.includes}
						<li>
							<form method="post" action="/app/training/{data.planId}/days/{day.index}/exercises">
								<input type="hidden" name="catalog_slug" value={e.slug} />
								<Button type="submit" variant="outline" size="sm">+ {dayLabel(i18n, day)}</Button>
							</form>
						</li>
					{/if}
				{/each}
			</ul>
		{/if}
	</section>
	{#if data.similar.length > 0 && e.primaryMuscles.length > 0}
		<section class="space-y-2">
			<div class="flex items-baseline justify-between gap-3">
				<MonoLabel text={i18n.tf('exercises.similar.title', muscleLabel(i18n, e.primaryMuscles[0]))} />
				<a href={pageURL({ muscle: e.primaryMuscles[0] }, 1)} class="text-signal text-xs hover:underline"
					>{i18n.t('exercises.similar.all')}</a
				>
			</div>
			<ul class="space-y-2">
				{#each data.similar as other (other.slug)}
					<ExerciseRow exercise={other} />
				{/each}
			</ul>
		</section>
	{/if}
	{#if illustrated}
		<ExerciseArtCredit />
	{/if}
</div>
