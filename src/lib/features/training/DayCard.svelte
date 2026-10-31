<!--
	One day of a plan (north-client workouts.templ dayShell + DayCard,
	DayCardSwapping, DayCardAdding): the weekday, its focus and status, the
	start time, the exercises, and the picker expanded in place of the row it
	replaces or at the end of the day.
-->
<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Plus from '@lucide/svelte/icons/plus';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import ExerciseRow from './ExerciseRow.svelte';
	import PickerPanel from './PickerPanel.svelte';
	import { edits, type EditResult } from './edits.js';
	import type { PlanDay } from './types.js';
	import { weekdayName } from './weekday.js';

	let {
		planID,
		dayIndex,
		day,
		busy = false,
		onEdit
	}: {
		planID: string;
		dayIndex: number;
		day: PlanDay;
		busy?: boolean;
		/** Runs one edit and shows the plan it produced; false when it was refused. */
		onEdit: (run: () => Promise<EditResult>) => Promise<boolean>;
	} = $props();

	const i18n = useI18n();

	/** The picker, when open: swapping exercise `index`, or adding (index null). */
	let picker: { index: number | null } | null = $state(null);
	let editingTime = $state(false);

	async function saveStartTime(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const startTime = String(form.get('start_time') ?? '');
		if (await onEdit(() => edits.setStartTime(planID, dayIndex, startTime))) editingTime = false;
	}

	async function pick(slug: string) {
		const at = picker;
		if (!at) return;
		const ok = await onEdit(() =>
			at.index === null ? edits.add(planID, dayIndex, slug) : edits.swap(planID, dayIndex, at.index, slug)
		);
		if (ok) picker = null;
	}
</script>

<div id="plan-day-{dayIndex}" class="plan-day" data-testid="plan-day">
	<Card.Root>
		<Card.Header>
			<div class="flex items-center gap-3">
				<Card.Title class="text-base">{weekdayName(i18n, day.weekday)}</Card.Title>
				<Badge variant="secondary">{day.focus}</Badge>
				{#if day.completedThisWeek}
					<Badge variant="outline" class="border-signal/40 text-signal gap-1" data-testid="day-completed">
						<CircleCheck class="size-3" />
						{i18n.t('workouts.status.completed')}
					</Badge>
				{:else if day.isNext}
					<Badge class="bg-signal text-signal-foreground" data-testid="day-next">{i18n.t('workouts.status.next')}</Badge>
				{/if}
			</div>
			<!-- When the session starts, edited in place; the phone reminds shortly before. -->
			<div class="mt-1">
				{#if !editingTime}
					<button
						type="button"
						onclick={() => (editingTime = true)}
						class="text-muted-foreground hover:text-foreground text-sm underline decoration-dotted underline-offset-4"
						title={i18n.t('workouts.start.title')}
					>
						{day.startTime ? i18n.tf('workouts.start.at', day.startTime) : i18n.t('workouts.start.set')}
					</button>
				{:else}
					<form class="flex flex-wrap items-end gap-2" onsubmit={saveStartTime}>
						<label class="text-muted-foreground text-xs">
							{i18n.t('workouts.start.label')}
							<Input name="start_time" type="time" value={day.startTime ?? ''} class="w-28" />
						</label>
						<Button type="submit" size="sm" disabled={busy}>{i18n.t('workouts.save')}</Button>
						<Button variant="ghost" size="sm" onclick={() => (editingTime = false)}>{i18n.t('workouts.cancel')}</Button>
					</form>
				{/if}
			</div>
		</Card.Header>
		<Card.Content>
			{#if day.exercises.length === 0}
				<p class="text-muted-foreground border-hairline rounded-lg border border-dashed px-4 py-6 text-center text-sm">
					{i18n.t('workouts.day.empty')}
				</p>
			{/if}
			<ul class="divide-border divide-y">
				{#each day.exercises as ex, j (j)}
					{#if picker?.index === j}
						<PickerPanel
							{planID}
							{dayIndex}
							index={j}
							subject={ex.name}
							{busy}
							onPick={pick}
							onCancel={() => (picker = null)}
						/>
					{:else}
						<ExerciseRow
							{dayIndex}
							index={j}
							{ex}
							dayLength={day.exercises.length}
							{busy}
							onPrescription={(sets, reps, rest) =>
								onEdit(() => edits.setPrescription(planID, dayIndex, j, sets, reps, rest))}
							onMove={(direction) => onEdit(() => edits.move(planID, dayIndex, j, direction))}
							onSwap={() => (picker = { index: j })}
							onRemove={async () => {
								await onEdit(() => edits.remove(planID, dayIndex, j));
							}}
						/>
					{/if}
				{/each}
				{#if picker && picker.index === null}
					<PickerPanel
						{planID}
						{dayIndex}
						index={null}
						subject={day.weekday}
						{busy}
						onPick={pick}
						onCancel={() => (picker = null)}
					/>
				{/if}
			</ul>
			<Button variant="outline" size="sm" class="mt-3" onclick={() => (picker = { index: null })}>
				<Plus class="size-3.5" />
				{i18n.t('workouts.day.add')}
			</Button>
		</Card.Content>
	</Card.Root>
</div>
