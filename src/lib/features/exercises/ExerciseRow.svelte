<!-- One catalog entry in a list (north-client web/exercises row). -->
<script lang="ts">
	import ExerciseEquipment from '#lib/components/khepri/ExerciseEquipment.svelte';
	import ExerciseThumbnail from '#lib/components/khepri/ExerciseThumbnail.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { muscleLabel } from './vocabulary.js';

	type Row = {
		slug: string;
		name: string;
		equipment: string;
		primaryMuscles: string[];
		illustrationSlug?: string;
	};

	let { exercise }: { exercise: Row } = $props();
	const i18n = useI18n();
</script>

<li>
	<a
		href="/app/exercises/{exercise.slug}"
		class="border-hairline bg-surface hover:border-signal/40 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-4 py-3 transition-colors"
	>
		<ExerciseThumbnail {exercise} idPrefix="art-row-" class="w-16" />
		<span class="min-w-0 flex-1 text-sm font-medium">{exercise.name}</span>
		{#each exercise.primaryMuscles as key (key)}
			<Badge variant="secondary">{muscleLabel(i18n, key)}</Badge>
		{/each}
		<ExerciseEquipment {exercise} />
	</a>
</li>
