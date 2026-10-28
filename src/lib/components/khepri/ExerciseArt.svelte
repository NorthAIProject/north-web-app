<!--
	The pose artwork for a catalog exercise (north-client exerciseart.Frames):
	three frames of one movement, cycled as a flipbook. The artwork is CC BY-SA
	4.0 — a page using this must also render <ExerciseArtCredit /> once.

	The frames are white-on-transparent SVGs used as a CSS mask over
	bg-current, so one asset serves both themes. Stacked rather than swapping
	one mask URL, so every frame is fetched on first paint; a hard cut rather
	than a crossfade, which would read as a double exposure.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import AspectRatio from '#lib/components/ui/aspectratio/aspectratio.svelte';
	import { FRAME_COUNT, FRAME_MS, maskFor } from './exercise-art.js';
	import type { ExerciseArtProps } from './types.js';

	let { id, slug, name, class: className = '' }: ExerciseArtProps = $props();

	const i18n = useI18n();
	const frames = Array.from({ length: FRAME_COUNT }, (_, i) => i + 1);
	let frame = $state(1);

	// Reduced motion: the first frame is a complete drawing on its own.
	$effect(() => {
		if (!slug) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const timer = setInterval(() => {
			frame = (frame % FRAME_COUNT) + 1;
		}, FRAME_MS);
		return () => clearInterval(timer);
	});
</script>

{#if slug}
	<AspectRatio ratio="square" class={className}>
		<div {id} class="text-foreground relative h-full w-full" role="img" aria-label={i18n.tf('layout.art.aria', name)}>
			{#each frames as n (n)}
				<span
					aria-hidden="true"
					class={['absolute inset-0 bg-current', frame === n ? 'opacity-100' : 'opacity-0']}
					style={maskFor(slug, n)}
				></span>
			{/each}
		</div>
	</AspectRatio>
{/if}
