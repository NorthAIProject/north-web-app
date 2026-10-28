<!--
	An exercise's pose artwork at row scale, or nothing when it has none
	(north-client exerciserow.Thumbnail). idPrefix must differ per list on a
	page; the slug is appended. class sizes the box.
-->
<script lang="ts">
	import ExerciseArt from './ExerciseArt.svelte';
	import { hasIllustration } from './exercise-art.js';
	import type { ExerciseLike } from './types.js';

	let { exercise, idPrefix, class: className = '' }: { exercise: ExerciseLike; idPrefix: string; class?: string } =
		$props();
</script>

{#if hasIllustration(exercise)}
	<span class={['shrink-0', className]}>
		<ExerciseArt id={idPrefix + exercise.slug} slug={exercise.illustrationSlug ?? ''} name={exercise.name} />
	</span>
{/if}
