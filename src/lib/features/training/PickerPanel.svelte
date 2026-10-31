<!--
	Chooses a catalog exercise: a few ranked suggestions, then a search over the
	rest of the catalog (north-client workouts.templ pickerPanel). Shared by
	swapping and adding, which differ only in the heading and what a pick does.
-->
<script lang="ts">
	import ExerciseEquipment from '#lib/components/khepri/ExerciseEquipment.svelte';
	import ExerciseThumbnail from '#lib/components/khepri/ExerciseThumbnail.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { pickerOptions } from './edits.js';
	import { DEFAULT_REPS, DEFAULT_REST_SECONDS, DEFAULT_SETS } from './plan.js';
	import type { CatalogExercise } from './types.js';
	import { weekdayName } from './weekday.js';

	let {
		planID,
		dayIndex,
		index,
		subject,
		busy = false,
		onPick,
		onCancel
	}: {
		planID: string;
		dayIndex: number;
		/** The exercise being replaced, or null when adding to the end of the day. */
		index: number | null;
		/** The exercise's name when swapping, the day's weekday when adding. */
		subject: string;
		busy?: boolean;
		onPick: (slug: string) => void;
		onCancel: () => void;
	} = $props();

	const i18n = useI18n();
	const adding = $derived(index === null);
	const heading = $derived(
		adding ? i18n.tf('workouts.picker.add', weekdayName(i18n, subject)) : i18n.tf('workouts.picker.swap', subject)
	);
	const note = $derived(
		adding
			? i18n.tf('workouts.picker.add.note', DEFAULT_SETS, DEFAULT_REPS, DEFAULT_REST_SECONDS)
			: i18n.t('workouts.picker.swap.note')
	);

	let query = $state('');
	let searched = $state('');
	let options: CatalogExercise[] = $state([]);
	let loaded = $state(false);

	// Go: hx-trigger="input changed delay:300ms" — the list follows the typing.
	$effect(() => {
		const q = query.trim();
		const controller = new AbortController();
		const timer = setTimeout(
			async () => {
				try {
					options = await pickerOptions(planID, dayIndex, index, q, controller.signal);
					searched = q;
					loaded = true;
				} catch (err) {
					if ((err as Error).name !== 'AbortError') throw err;
				}
			},
			loaded ? 300 : 0
		);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});
</script>

<li class="bg-surface -mx-4 px-4 py-4" data-testid="exercise-picker">
	<div class="flex items-baseline justify-between gap-4">
		<p class="text-sm font-medium">{heading}</p>
		<Button variant="ghost" size="sm" onclick={onCancel}>{i18n.t('workouts.cancel')}</Button>
	</div>
	<p class="text-muted-foreground mt-1 text-xs">{note}</p>
	<form class="mt-3" onsubmit={(e) => e.preventDefault()}>
		<Input
			name="q"
			type="search"
			bind:value={query}
			placeholder={i18n.t('workouts.picker.search')}
			aria-label={i18n.t('workouts.picker.search')}
		/>
	</form>
	{#if loaded && searched === '' && options.length > 0}
		<MonoLabel text={i18n.t('workouts.picker.suggested')} />
		<ul class="mt-2 space-y-1">
			{#each options as option (option.slug)}
				{@render pickerOption(option)}
			{/each}
		</ul>
	{/if}
	{#if loaded && searched !== ''}
		<MonoLabel text={i18n.t('workouts.picker.matches')} />
		{#if options.length === 0}
			<p class="text-muted-foreground mt-2 text-sm">{i18n.t('workouts.picker.none')}</p>
		{:else}
			<ul class="mt-2 space-y-1">
				{#each options as option (option.slug)}
					{@render pickerOption(option)}
				{/each}
			</ul>
		{/if}
	{/if}
</li>

{#snippet pickerOption(option: CatalogExercise)}
	<li>
		<button
			type="button"
			disabled={busy}
			onclick={() => onPick(option.slug)}
			class="border-hairline hover:border-signal/40 flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors"
		>
			<ExerciseThumbnail exercise={option} idPrefix="pick-" class="w-12" />
			<span class="min-w-0 flex-1 text-sm">{option.name}</span>
			<ExerciseEquipment exercise={option} />
		</button>
	</li>
{/snippet}
