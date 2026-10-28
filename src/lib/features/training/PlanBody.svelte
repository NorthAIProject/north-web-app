<!--
	Everything an edit can change (north-client workouts.templ PlanBody): the
	note on what no longer matches the intake, the day cards, and the artwork
	credit. An edit stores a new version, so every day re-renders from it.
-->
<script lang="ts">
	import ExerciseArtCredit from '#lib/components/khepri/ExerciseArtCredit.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import DayCard from './DayCard.svelte';
	import type { EditResult } from './edits.js';
	import { anyIllustrated } from './plan.js';
	import type { PlanDetail } from './types.js';

	let {
		plan,
		busy = false,
		error = '',
		onEdit
	}: {
		plan: PlanDetail;
		busy?: boolean;
		/** Why the last edit was refused, in the plan's own words. */
		error?: string;
		onEdit: (run: () => Promise<EditResult>) => Promise<boolean>;
	} = $props();

	const i18n = useI18n();
</script>

<div id="plan-body">
	{#if error}
		<Alert.Root variant="destructive" class="mb-6">
			<Alert.Description>{error}</Alert.Description>
		</Alert.Root>
	{/if}
	{#if plan.problems.length > 0}
		<!-- Default, not destructive: a note about what changed; nothing was rejected. -->
		<Alert.Root class="mb-6">
			<Alert.Title>{i18n.t('workouts.problems.title')}</Alert.Title>
			<Alert.Description>
				<ul class="list-disc space-y-1 pl-4">
					{#each plan.problems as problem, i (i)}
						<li>{problem}</li>
					{/each}
				</ul>
			</Alert.Description>
		</Alert.Root>
	{/if}
	<div class="space-y-4">
		{#each plan.days as day, i (i)}
			<DayCard planID={plan.id} dayIndex={i} {day} {busy} {onEdit} />
		{/each}
	</div>
	<div class="mt-6">
		{#if anyIllustrated(plan)}
			<ExerciseArtCredit />
		{/if}
	</div>
</div>
