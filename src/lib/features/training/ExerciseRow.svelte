<!--
	One exercise of a plan day (north-client workouts.templ exerciseRow): the
	artwork, the prescription that expands into its own small form, the cues,
	reorder/swap/remove, and the muscles dialog.
-->
<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import Repeat from '@lucide/svelte/icons/repeat';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExerciseArt from '#lib/components/khepri/ExerciseArt.svelte';
	import MuscleViewer from '#lib/components/khepri/MuscleViewer.svelte';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { exerciseDetails, hasArt, hasMuscles, prescription } from './plan.js';
	import type { PlanExercise } from './types.js';

	let {
		dayIndex,
		index,
		ex,
		dayLength,
		busy = false,
		onPrescription,
		onMove,
		onSwap,
		onRemove
	}: {
		dayIndex: number;
		index: number;
		ex: PlanExercise;
		dayLength: number;
		busy?: boolean;
		onPrescription: (sets: number, reps: string, restSeconds: number) => Promise<boolean>;
		onMove: (direction: 'up' | 'down') => void;
		onSwap: () => void;
		onRemove: () => Promise<void>;
	} = $props();

	const i18n = useI18n();
	const id = $derived(`exercise-${dayIndex}-${index}`);
	let editing = $state(false);
	let confirmOpen = $state(false);
	let musclesOpen = $state(false);

	/** Go: atoiOr — an empty or unreadable number becomes a value the plan rejects in words. */
	function atoiOr(v: FormDataEntryValue | null, fallback: number): number {
		const n = Number.parseInt(String(v ?? '').trim(), 10);
		return Number.isNaN(n) ? fallback : n;
	}

	async function savePrescription(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const ok = await onPrescription(atoiOr(form.get('sets'), 0), String(form.get('reps') ?? ''), atoiOr(form.get('rest_seconds'), -1));
		if (ok) editing = false;
	}
</script>

<li class="py-3 first:pt-0 last:pb-0" data-testid="plan-exercise">
	<div class="flex gap-3">
		{#if hasArt(ex)}
			<span class="w-16 shrink-0">
				<ExerciseArt id="{id}-art" slug={ex.illustrationSlug ?? ''} name={ex.name} />
			</span>
		{/if}
		<div class="min-w-0 flex-1">
			<div>
				<div class="flex items-baseline justify-between gap-4">
					<span class="font-medium">{ex.name}</span>
					<button
						type="button"
						onclick={() => (editing = !editing)}
						aria-expanded={editing}
						aria-label="{i18n.t('workouts.ex.edit.title')}: {prescription(i18n, ex)}"
						class="text-muted-foreground hover:text-foreground shrink-0 font-mono text-sm underline decoration-dotted underline-offset-4"
						title={i18n.t('workouts.ex.edit.title')}
					>
						{prescription(i18n, ex)}
					</button>
				</div>
				{#if editing}
					<form class="mt-2 flex flex-wrap items-end gap-2" onsubmit={savePrescription}>
						<label class="text-muted-foreground text-xs">
							{i18n.t('workouts.ex.sets')}
							<Input name="sets" type="number" value={String(ex.sets)} class="w-16" />
						</label>
						<label class="text-muted-foreground text-xs">
							{i18n.t('workouts.ex.reps')}
							<Input name="reps" value={ex.reps} class="w-24" />
						</label>
						<label class="text-muted-foreground text-xs">
							{i18n.t('workouts.ex.rest')}
							<Input name="rest_seconds" type="number" value={String(ex.restSeconds)} class="w-20" />
						</label>
						<Button type="submit" size="sm" disabled={busy}>{i18n.t('workouts.save')}</Button>
						<Button variant="ghost" size="sm" onclick={() => (editing = false)}>{i18n.t('workouts.cancel')}</Button>
					</form>
				{/if}
			</div>
			<!-- A swap clears the cue rather than carrying one that described the previous movement. -->
			{#if ex.formCues}
				<p class="text-muted-foreground mt-1 text-sm">{ex.formCues}</p>
			{/if}
			<p class="text-muted-foreground mt-1 text-xs">
				{exerciseDetails(i18n, ex)}
				{#if ex.substitute}
					· {i18n.tf('workouts.ex.substitute', ex.substitute)}
				{/if}
			</p>
			<div class="mt-2 flex flex-wrap items-center gap-2">
				<!-- Order is training information, so the ends simply have no button. -->
				{#if index > 0}
					<Button variant="ghost" size="icon" aria-label={i18n.t('workouts.ex.moveup')} disabled={busy} onclick={() => onMove('up')}>
						<ArrowUp class="size-3.5" />
					</Button>
				{/if}
				{#if index < dayLength - 1}
					<Button
						variant="ghost"
						size="icon"
						aria-label={i18n.t('workouts.ex.movedown')}
						disabled={busy}
						onclick={() => onMove('down')}
					>
						<ArrowDown class="size-3.5" />
					</Button>
				{/if}
				<Button variant="outline" size="sm" disabled={busy} onclick={onSwap}>
					<Repeat class="size-3.5" />
					{i18n.t('workouts.ex.swap')}
				</Button>
				<!-- Confirmed because nothing on screen offers an undo (Go: hx-confirm). -->
				<Dialog.Root bind:open={confirmOpen}>
					<Dialog.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })} disabled={busy}>
						<Trash2 class="size-3.5" />
						{i18n.t('workouts.ex.remove')}
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>{i18n.tf('workouts.ex.remove.confirm', ex.name)}</Dialog.Title>
						</Dialog.Header>
						<Dialog.Footer>
							<Dialog.Close class={buttonVariants({ variant: 'outline' })}>{i18n.t('workouts.cancel')}</Dialog.Close>
							<Button
								variant="destructive"
								disabled={busy}
								onclick={async () => {
									confirmOpen = false;
									await onRemove();
								}}
							>
								{i18n.t('workouts.ex.remove')}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</div>
			<!-- Older plans have no muscle data at all; the trigger only appears with something to show. -->
			{#if hasMuscles(ex)}
				<Dialog.Root bind:open={musclesOpen}>
					<Dialog.Trigger class={[buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-2 inline-flex']}>
						<Dumbbell class="size-3.5" />
						{i18n.t('workouts.ex.muscles')}
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>{ex.name}</Dialog.Title>
						</Dialog.Header>
						{#if musclesOpen}
							<MuscleViewer
								id="{id}-viewer"
								primary={ex.primaryMuscles}
								secondary={ex.secondaryMuscles}
								stabilizers={ex.stabilizerMuscles ?? []}
								exerciseName={ex.name}
							/>
						{/if}
					</Dialog.Content>
				</Dialog.Root>
			{/if}
		</div>
	</div>
</li>
