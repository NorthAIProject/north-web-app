<!--
	What an exercise needs, or nothing for bodyweight (north-client
	exerciserow.Equipment).
-->
<script lang="ts">
	import { needsEquipment } from './exercise-art.js';
	import type { ExerciseLike } from './types.js';

	let { exercise }: { exercise: ExerciseLike } = $props();
</script>

{#if needsEquipment(exercise)}
	<span class="text-muted-foreground shrink-0 font-mono text-[10px] uppercase tracking-[0.14em]">
		{exercise.equipment}
	</span>
{/if}
